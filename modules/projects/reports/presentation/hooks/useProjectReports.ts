'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as reportsApi from '../../infrastructure/api/reports.api'
import type { ProjectReportKey, ProjectReportResult } from '../../domain/model/reports'
import { PROJECT_REPORT_OPTIONS } from '../../domain/rules/reports.rules'

export function useProjectReports(projectId: string | null) {
  const [reportKey, setReportKey] = useState<ProjectReportKey>(PROJECT_REPORT_OPTIONS[0].key)
  const [result, setResult] = useState<ProjectReportResult>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await reportsApi.getProjectReport(projectId, reportKey)
      setResult(res)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load report')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, reportKey])

  useEffect(() => {
    void load()
  }, [load])

  return {
    reportKey,
    setReportKey,
    result,
    loading,
    error,
    forbidden,
    refetch: load,
  }
}
