'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Typography, Button, ContentLoader, Select, Textarea, ConfirmDialog } from '@/shared/ui'
import {
  AIAgentVersionStatusBadge,
  formatEstimatedCost,
  formatTokens,
} from '@/modules/admin/ai-agents/ui/ai-agent-badges'
import * as playgroundApi from '../api/ai-prompt-playground.api'
import * as aiAgentsApi from '@/modules/admin/ai-agents/api/ai-agents.api'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { AIRunFeedbackControls } from '@/modules/admin/ai-feedback/ui/ai-run-feedback-controls'
import type {
  PromptActualTestResult,
  PromptDryRunResult,
  PromptPlaygroundContext,
} from '@/modules/admin/ai-playground'
import type { AIAgentVersionDetail, AIRunMode } from '@/modules/admin/ai-agents'

const MODE_OPTIONS: { value: AIRunMode; label: string }[] = [
  { value: 'generate', label: 'Generate' },
  { value: 'improve', label: 'Improve' },
  { value: 'assess', label: 'Assess' },
  { value: 'summarize', label: 'Summarize' },
  { value: 'extract', label: 'Extract' },
  { value: 'classify', label: 'Classify' },
  { value: 'compare', label: 'Compare' },
  { value: 'recommend', label: 'Recommend' },
  { value: 'validate', label: 'Validate' },
]

interface AIAgentPlaygroundPanelProps {
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

export function AIAgentPlaygroundPanel({ agentId, orgId }: AIAgentPlaygroundPanelProps) {
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
    loadContext()
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

  if (loading || !context) return <ContentLoader />

  const versionOptions = testableVersions.map((version) => ({
    value: version.versionId,
    label: `v${version.versionNumber} (${version.status})`,
  }))

  const highCostEstimate =
    dryRunResult?.estimatedUsage.estimatedCost != null &&
    dryRunResult.estimatedUsage.estimatedCost > 0.5

  return (
    <div className="space-y-6">
      <Typography variant="small" tone="muted">
        Dry run validates prompt rendering without calling the AI provider. Run test will call the
        AI provider and may consume budget. Testing a draft version does not publish it. Output is
        not saved to production data.
      </Typography>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
          <Typography weight="medium">Configuration</Typography>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Version</label>
            <Select
              options={versionOptions}
              value={versionId}
              onValueChange={setVersionId}
              className="w-full"
              size="sm"
            />
            {selectedVersion ? (
              <div className="mt-2 flex items-center gap-2">
                <AIAgentVersionStatusBadge status={selectedVersion.status} />
                {selectedVersion.status !== 'published' ? (
                  <Typography variant="xs" className="text-amber-700">
                    Draft/testing — not used in production until published
                  </Typography>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Mode</label>
            <Select
              options={MODE_OPTIONS}
              value={mode}
              onValueChange={(value: string) => setMode(value as AIRunMode)}
              className="w-full"
              size="sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipRouting}
              onChange={(event) => setSkipRouting(event.target.checked)}
            />
            Bypass routing (test version model only)
          </label>

          {versionDetail ? (
            <div className="rounded-md border border-neutral-100 bg-neutral-50 p-3 text-sm">
              <Typography variant="small" weight="medium" className="mb-1">
                Prompt preview
              </Typography>
              <Typography variant="xs" tone="muted">
                System: {versionDetail.systemPrompt ? 'configured' : 'none'} · Developer:{' '}
                {versionDetail.developerPrompt ? 'configured' : 'none'} · User template:{' '}
                {versionDetail.userPromptTemplate
                  ? `${versionDetail.userPromptTemplate.length} chars`
                  : 'default'}
              </Typography>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
          <Typography weight="medium">Test input</Typography>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Test input (JSON object or plain text wrapped as object)
            </label>
            <Textarea
              value={testInput}
              onChange={(event) => setTestInput(event.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Prompt variables (JSON object)
            </label>
            <Textarea
              value={promptVariables}
              onChange={(event) => setPromptVariables(event.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          <Typography variant="xs" tone="muted">
            Avoid pasting sensitive production data. Test input is not stored by default.
          </Typography>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleDryRun} disabled={dryRunning}>
          {dryRunning ? 'Dry running…' : 'Dry run'}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (highCostEstimate) {
              setConfirmRunOpen(true)
              return
            }
            handleRunTest()
          }}
          disabled={running || dryRunResult?.success === false}
        >
          {running ? 'Running test…' : 'Run test'}
        </Button>
      </div>

      {dryRunResult ? (
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <Typography weight="medium">Dry-run result</Typography>
          <p>User message length: {dryRunResult.renderedPromptSummary.userMessageLength}</p>
          <p>Variables: {dryRunResult.renderedPromptSummary.variableKeys.join(', ') || 'none'}</p>
          <p>
            Model: {dryRunResult.routingDecision.selectedModelName}
            {dryRunResult.routingDecision.routingApplied ? ' (routing applied)' : ''}
          </p>
          <p>{dryRunResult.routingDecision.routingReason}</p>
          <p>
            Estimated tokens: {formatTokens(dryRunResult.estimatedUsage.estimatedTotalTokens)}
            {dryRunResult.estimatedUsage.estimatedCost != null
              ? ` · ~${formatEstimatedCost(dryRunResult.estimatedUsage.estimatedCost, dryRunResult.estimatedUsage.currency)}`
              : ' · cost estimate unavailable'}
          </p>
          {dryRunResult.validationErrors.length > 0 ? (
            <div className="text-red-700">
              {dryRunResult.validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
          {dryRunResult.warnings.map((warning) => (
            <p key={warning} className="text-amber-700">
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      {testResult ? (
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <Typography weight="medium">Test result</Typography>
          {!testResult.success ? (
            <p className="text-red-700">{testResult.error?.message ?? 'Test failed'}</p>
          ) : (
            <>
              {testResult.runId ? <p>Run ID: {testResult.runId}</p> : null}
              {testResult.modelName ? (
                <p>
                  Model: {testResult.provider}/{testResult.modelName}
                </p>
              ) : null}
              {testResult.usage ? (
                <p>
                  Tokens: {formatTokens(testResult.usage.totalTokens)} (in{' '}
                  {formatTokens(testResult.usage.inputTokens)} / out{' '}
                  {formatTokens(testResult.usage.outputTokens)})
                </p>
              ) : null}
              {testResult.estimatedCost != null ? (
                <p>
                  Cost:{' '}
                  {formatEstimatedCost(testResult.estimatedCost, testResult.currency ?? 'USD')}
                </p>
              ) : null}
              {testResult.latencyMs != null ? <p>Latency: {testResult.latencyMs}ms</p> : null}
              {testResult.outputValidation ? (
                <p
                  className={
                    testResult.outputValidation.valid ? 'text-green-700' : 'text-amber-700'
                  }
                >
                  Output validation:{' '}
                  {!testResult.outputValidation.schemaConfigured
                    ? 'No output schema configured'
                    : testResult.outputValidation.valid
                      ? 'Passed'
                      : testResult.outputValidation.errors.join('; ')}
                </p>
              ) : null}
              {testResult.output != null ? (
                <pre className="max-h-96 overflow-auto rounded-md bg-neutral-50 p-3 text-xs">
                  {typeof testResult.output === 'string'
                    ? testResult.output
                    : JSON.stringify(testResult.output, null, 2)}
                </pre>
              ) : null}
              {testResult.runId && orgId ? (
                <AIRunFeedbackControls orgId={orgId} runId={testResult.runId} compact />
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmRunOpen}
        onClose={() => setConfirmRunOpen(false)}
        title="Run prompt test?"
        message="This will call the AI provider and may consume budget. Estimated cost is higher than usual for this test."
        confirmLabel="Run test"
        onConfirm={handleRunTest}
      />
    </div>
  )
}
