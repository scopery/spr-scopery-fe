'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/reporting.api'
import { PROJECT_REPORT_KEYS } from '../../infrastructure/api/reporting.api'
import type { ProjectDashboardSummary } from '../../domain/model/report'

export function useProjectDashboard(projectId: string | null) {
  const [data, setData] = useState<ProjectDashboardSummary | null>(null)
  const [reports, setReports] = useState<Record<string, Record<string, unknown>>>({})
  const [activity, setActivity] = useState<
    Array<{ id: string; summary?: string; createdAt?: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [dash, feed, ...reportResults] = await Promise.all([
        api.getProjectDashboard(projectId),
        api.listActivityFeed(projectId),
        ...PROJECT_REPORT_KEYS.map((key) =>
          api.getProjectReport(projectId, key).catch(() => ({} as Record<string, unknown>))
        ),
      ])
      setData(dash)
      setActivity(feed.items)
      const next: Record<string, Record<string, unknown>> = {}
      PROJECT_REPORT_KEYS.forEach((key, i) => {
        next[key] = reportResults[i] as Record<string, unknown>
      })
      setReports(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, reports, activity, loading, error, refetch: load }
}
