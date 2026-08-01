'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/requirement-traceability.api'
import type { TraceabilityOverviewResponse } from '../model/requirement-traceability'

export function useTraceabilityOverview(projectId: string | null) {
  const [data, setData] = useState<TraceabilityOverviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      setData(await api.getTraceabilityOverview(projectId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
