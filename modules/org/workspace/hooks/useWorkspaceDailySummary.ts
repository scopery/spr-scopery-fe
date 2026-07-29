'use client'

import { useCallback, useEffect, useState } from 'react'
import { getWorkspaceDailySummary } from '../api/workspace-daily-summary.api'
import type { WorkspaceDailySummary } from '../model/workspace-daily-summary'

export function useWorkspaceDailySummary(workspaceId: string, date: string) {
  const [data, setData] = useState<WorkspaceDailySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await getWorkspaceDailySummary(workspaceId, date)
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily summary')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, date])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
