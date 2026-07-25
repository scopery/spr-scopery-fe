'use client'

import { useCallback, useEffect, useState } from 'react'
import * as productivityApi from '../../infrastructure/api/productivity.api'
import type { MyInsightsParams, MyInsightsResponse } from '../../domain/model/my-insights'

export function useMyInsights(workspaceId: string | null, params: MyInsightsParams) {
  const [data, setData] = useState<MyInsightsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await productivityApi.getMyInsights(workspaceId, params)
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [
    workspaceId,
    params.range,
    params.dateFrom,
    params.dateTo,
    params.projectId,
    params.phaseId,
    params.status,
    params.heatmapMetric,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
