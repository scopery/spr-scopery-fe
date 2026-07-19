'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import * as api from '../../infrastructure/api/reporting.api'
import type { ReportDefinition, ReportExportJob, ReportRun } from '../../domain/model/report'

export function useReportLibrary(projectIdProp?: string | null) {
  const params = useParams<{ projectId?: string }>()
  const projectId = projectIdProp ?? params.projectId ?? null

  const [definitions, setDefinitions] = useState<ReportDefinition[]>([])
  const [exports, setExports] = useState<ReportExportJob[]>([])
  const [activeRun, setActiveRun] = useState<ReportRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadDefinitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listReportDefinitions()
      setDefinitions(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadExports = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await api.listExportJobs(projectId)
      setExports(res.items)
    } catch {
      // Export list is secondary — keep definitions usable
    }
  }, [projectId])

  useEffect(() => {
    void loadDefinitions()
  }, [loadDefinitions])

  useEffect(() => {
    void loadExports()
  }, [loadExports])

  const runReport = useCallback(
    async (code: string) => {
      setActionError(null)
      try {
        const run = await api.startReportRun({
          reportCode: code,
          ...(projectId ? { projectId } : {}),
        })
        setActiveRun(run)
        return run
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to start run')
        return null
      }
    },
    [projectId]
  )

  const refreshRun = useCallback(async () => {
    if (!activeRun) return
    const run = await api.getReportRun(activeRun.id)
    setActiveRun(run)
    return run
  }, [activeRun])

  const exportActiveRun = useCallback(
    async (format = 'CSV') => {
      if (!activeRun) return null
      setActionError(null)
      try {
        const job = await api.requestRunExport(activeRun.id, {
          format,
          fileName: `${activeRun.reportCode}.${format.toLowerCase()}`,
        })
        await loadExports()
        return job
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Export failed')
        return null
      }
    },
    [activeRun, loadExports]
  )

  const cancelExport = useCallback(
    async (exportJobId: string) => {
      setActionError(null)
      try {
        await api.cancelExportJob(exportJobId)
        await loadExports()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Cancel failed')
      }
    },
    [loadExports]
  )

  return {
    projectId,
    definitions,
    exports,
    activeRun,
    loading,
    error,
    actionError,
    refetch: loadDefinitions,
    refreshExports: loadExports,
    runReport,
    refreshRun,
    exportActiveRun,
    cancelExport,
    openDownload: api.openExportDownload,
  }
}
