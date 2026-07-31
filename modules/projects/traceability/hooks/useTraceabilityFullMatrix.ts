'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/requirement-traceability.api'
import type {
  TraceabilityMatrixQuery,
  TraceabilityMatrixResponse,
} from '../model/requirement-traceability'

export function useTraceabilityFullMatrix(
  projectId: string | null,
  query: TraceabilityMatrixQuery
) {
  const [data, setData] = useState<TraceabilityMatrixResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getTraceabilityMatrix(projectId, query)
      setData(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load traceability matrix')
    } finally {
      setLoading(false)
    }
  }, [
    projectId,
    query.q,
    query.coverageStatus,
    query.gapCode,
    query.requirementType,
    query.showGapsOnly,
    query.limit,
    query.offset,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
