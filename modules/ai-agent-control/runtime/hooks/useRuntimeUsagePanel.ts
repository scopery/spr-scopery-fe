'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import * as agentControlApi from '@/modules/ai-agent-control/agent-control/api/agent-control.api'
import type {
  OrgAgentRuntimeMetadata,
  OrgAgentRun,
  OrgRuntimeResolution,
  OrgRuntimeUsageSummary,
} from '@/modules/ai-agent-control/agent-control/model/agent-control-types'

interface UseRuntimeUsagePanelParams {
  orgId: string
  canViewRuntime: boolean
  canViewUsage: boolean
}

export function useRuntimeUsagePanel({
  orgId,
  canViewRuntime,
  canViewUsage,
}: UseRuntimeUsagePanelParams) {
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<OrgAgentRuntimeMetadata | null>(null)
  const [runs, setRuns] = useState<OrgAgentRun[]>([])
  const [summary, setSummary] = useState<OrgRuntimeUsageSummary | null>(null)
  const [featureKey, setFeatureKey] = useState('answer_improve')
  const [orgAgentKey, setOrgAgentKey] = useState('')
  const [bindingKey, setBindingKey] = useState('default')
  const [preview, setPreview] = useState<OrgRuntimeResolution | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [meta, runsRes, summaryRes] = await Promise.all([
        canViewRuntime ? agentControlApi.getRuntimeMetadata(orgId) : Promise.resolve(null),
        canViewUsage
          ? agentControlApi.listOrgAgentRuns(orgId, {
              status: statusFilter || undefined,
              limit: 50,
            })
          : Promise.resolve({ items: [], total: 0 }),
        canViewUsage ? agentControlApi.getRuntimeUsageSummary(orgId) : Promise.resolve(null),
      ])
      setMetadata(meta)
      setRuns(runsRes.items)
      setSummary(summaryRes)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load runtime data')
    } finally {
      setLoading(false)
    }
  }, [orgId, canViewRuntime, canViewUsage, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const handlePreview = async () => {
    if (!canViewRuntime) return
    setPreviewLoading(true)
    try {
      const result = await agentControlApi.previewRuntimeResolution(orgId, {
        feature_key: featureKey,
        org_agent_key: orgAgentKey.trim() || undefined,
        binding_key: bindingKey.trim() || undefined,
      })
      setPreview(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to preview resolution')
    } finally {
      setPreviewLoading(false)
    }
  }

  return {
    loading,
    metadata,
    runs,
    summary,
    featureKey,
    orgAgentKey,
    bindingKey,
    preview,
    previewLoading,
    statusFilter,
    setFeatureKey,
    setOrgAgentKey,
    setBindingKey,
    setStatusFilter,
    handlePreview,
  }
}
