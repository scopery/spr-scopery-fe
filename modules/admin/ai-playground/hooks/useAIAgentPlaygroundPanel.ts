'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as playgroundApi from '../api/ai-prompt-playground.api'
import * as aiAgentsApi from '@/modules/admin/ai-agents/api/ai-agents.api'
import type {
  PromptActualTestResult,
  PromptDryRunResult,
  PromptPlaygroundContext,
} from '@/modules/admin/ai-playground'
import type { AIAgentVersionDetail, AIRunMode } from '@/modules/admin/ai-agents'

interface UseAIAgentPlaygroundPanelParams {
  agentId: string
  orgId?: string
}

function parseJsonObject(raw: string, fieldName: string): Record<string, unknown> | null {
  const trimmed = raw.trim()
  if (!trimmed) return {}
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      toast.error(`${fieldName} must be a JSON object.`)
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    toast.error(`${fieldName} contains invalid JSON.`)
    return null
  }
}

export function useAIAgentPlaygroundPanel({ agentId, orgId }: UseAIAgentPlaygroundPanelParams) {
  const [context, setContext] = useState<PromptPlaygroundContext | null>(null)
  const [versionDetail, setVersionDetail] = useState<AIAgentVersionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [versionId, setVersionId] = useState('')
  const [mode, setMode] = useState<AIRunMode>('generate')
  const [testInput, setTestInput] = useState('{\n  "input": "Sample test input"\n}')
  const [promptVariables, setPromptVariables] = useState('{}')
  const [skipRouting, setSkipRouting] = useState(false)
  const [dryRunResult, setDryRunResult] = useState<PromptDryRunResult | null>(null)
  const [testResult, setTestResult] = useState<PromptActualTestResult | null>(null)
  const [dryRunning, setDryRunning] = useState(false)
  const [running, setRunning] = useState(false)
  const [confirmRunOpen, setConfirmRunOpen] = useState(false)

  const testableVersions = useMemo(
    () => context?.versions.filter((version) => version.testable) ?? [],
    [context]
  )

  const loadContext = useCallback(async () => {
    setLoading(true)
    try {
      const data = await playgroundApi.getPlaygroundContext(agentId, orgId)
      setContext(data)
      const defaultVersion =
        data.versions.find((version) => version.status === 'draft' && version.testable) ??
        data.versions.find((version) => version.status === 'testing' && version.testable) ??
        data.versions.find((version) => version.versionId === data.publishedVersionId) ??
        data.versions.find((version) => version.testable)
      if (defaultVersion) {
        setVersionId(defaultVersion.versionId)
      }
      setMode(data.defaultMode)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [agentId, orgId])

  useEffect(() => {
    void loadContext()
  }, [loadContext])

  useEffect(() => {
    if (!versionId) {
      setVersionDetail(null)
      return
    }
    aiAgentsApi
      .getAgentVersion(agentId, versionId)
      .then(setVersionDetail)
      .catch((err) => toast.error(getProblemToastMessage(err)))
  }, [agentId, versionId])

  const buildPayload = () => {
    const parsedInput = parseJsonObject(testInput, 'Test input')
    if (parsedInput == null) return null
    const parsedVariables = parseJsonObject(promptVariables, 'Prompt variables')
    if (parsedVariables == null) return null
    if (!versionId) {
      toast.error('Select a version to test.')
      return null
    }
    return {
      agent_version_id: versionId,
      mode,
      org_id: orgId,
      test_input: parsedInput,
      prompt_variables: parsedVariables,
      skip_routing: skipRouting,
    }
  }

  const handleDryRun = async () => {
    const payload = buildPayload()
    if (!payload) return
    setDryRunning(true)
    setDryRunResult(null)
    try {
      const result = await playgroundApi.dryRunPromptTest(agentId, payload)
      setDryRunResult(result)
      if (!result.success) {
        toast.error('Dry run found validation issues.')
      } else {
        toast.success('Dry run completed.')
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setDryRunning(false)
    }
  }

  const handleRunTest = async () => {
    const payload = buildPayload()
    if (!payload) return
    setRunning(true)
    setTestResult(null)
    setConfirmRunOpen(false)
    try {
      const result = await playgroundApi.runPromptTest(agentId, payload)
      setTestResult(result)
      if (result.success) {
        toast.success('Prompt test completed.')
      } else {
        toast.error(result.error?.message ?? 'Prompt test failed.')
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setRunning(false)
    }
  }

  const selectedVersion = testableVersions.find((version) => version.versionId === versionId)

  const highCostEstimate =
    dryRunResult?.estimatedUsage.estimatedCost != null &&
    dryRunResult.estimatedUsage.estimatedCost > 0.5

  const requestRunTest = () => {
    if (highCostEstimate) {
      setConfirmRunOpen(true)
      return
    }
    void handleRunTest()
  }

  return {
    context,
    versionDetail,
    loading,
    versionId,
    mode,
    testInput,
    promptVariables,
    skipRouting,
    dryRunResult,
    testResult,
    dryRunning,
    running,
    confirmRunOpen,
    testableVersions,
    selectedVersion,
    highCostEstimate,
    setVersionId,
    setMode,
    setTestInput,
    setPromptVariables,
    setSkipRouting,
    setConfirmRunOpen,
    handleDryRun,
    handleRunTest,
    requestRunTest,
  }
}
