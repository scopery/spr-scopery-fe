'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/requirement-traceability.api'
import type { CoverageSummaryResponse } from '../model/requirement-traceability'

export function useCoverageSummary(projectId: string | null) {
  const [data, setData] = useState<CoverageSummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getCoverageSummary(projectId)
      setData(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load coverage summary')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
