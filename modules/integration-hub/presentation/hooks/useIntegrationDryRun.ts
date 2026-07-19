'use client'

import { useCallback, useState } from 'react'
import { apiClient } from '@/shared/lib/apiClient'
import { INTEGRATION_ENDPOINTS } from '../../infrastructure/api/endpoints'
import { useIntegrations } from './useIntegrations'
import type { UnifiedJob } from '@/shared/lib/unifiedJob'

export function useIntegrationDryRun(workspaceId: string | null) {
  const { items, loading, error, refetch } = useIntegrations(workspaceId)
  const [dryRunJob, setDryRunJob] = useState<UnifiedJob | null>(null)
  const [lastResult, setLastResult] = useState<{
    total: number
    success: number
    failed: number
  } | null>(null)
  const [dryRunComplete, setDryRunComplete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const runDryRun = useCallback(async () => {
    if (!workspaceId) return
    setBusy(true)
    setActionError(null)
    setDryRunComplete(false)
    setDryRunJob({
      jobId: 'dry-run',
      jobType: 'IMPORT_DRY_RUN',
      status: 'RUNNING',
      progressPercent: 10,
    })
    try {
      const res = await apiClient.post<{
        jobId: string
        status: string
        total?: number
        success?: number
        failed?: number
      }>(`${INTEGRATION_ENDPOINTS.imports(workspaceId)}/dry-run`, {})
      setDryRunJob({
        jobId: res.jobId,
        jobType: 'IMPORT_DRY_RUN',
        status: res.status,
        progressPercent: 100,
      })
      setLastResult({
        total: res.total ?? 0,
        success: res.success ?? 0,
        failed: res.failed ?? 0,
      })
      setDryRunComplete(true)
      await refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Dry-run failed')
      setDryRunJob((j) =>
        j
          ? { ...j, status: 'FAILED', errorMessage: err instanceof Error ? err.message : 'Failed' }
          : j
      )
      setDryRunComplete(false)
    } finally {
      setBusy(false)
    }
  }, [workspaceId, refetch])

  const executeImport = useCallback(async () => {
    if (!workspaceId || !dryRunComplete) return
    setBusy(true)
    setActionError(null)
    setDryRunJob({
      jobId: dryRunJob?.jobId ?? 'execute',
      jobType: 'IMPORT_EXECUTE',
      status: 'RUNNING',
      progressPercent: 20,
    })
    try {
      const res = await apiClient.post<{
        jobId: string
        status: string
        total?: number
        success?: number
        failed?: number
      }>(`${INTEGRATION_ENDPOINTS.imports(workspaceId)}/execute`, {
        confirmDryRun: true,
        dryRunJobId: dryRunJob?.jobId,
      })
      setDryRunJob({
        jobId: res.jobId,
        jobType: 'IMPORT_EXECUTE',
        status: res.status,
        progressPercent: 100,
      })
      setLastResult({
        total: res.total ?? lastResult?.total ?? 0,
        success: res.success ?? lastResult?.success ?? 0,
        failed: res.failed ?? lastResult?.failed ?? 0,
      })
      setDryRunComplete(false)
      await refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Execute failed')
      setDryRunJob((j) =>
        j
          ? { ...j, status: 'FAILED', errorMessage: err instanceof Error ? err.message : 'Failed' }
          : j
      )
    } finally {
      setBusy(false)
    }
  }, [workspaceId, dryRunComplete, dryRunJob?.jobId, lastResult, refetch])

  return {
    items,
    loading,
    error,
    dryRunJob,
    lastResult,
    dryRunComplete,
    busy,
    actionError,
    runDryRun,
    executeImport,
    refetch,
  }
}
