'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/requirement-traceability.api'
import type {
  CoverageListQuery,
  UseCaseCoverageListResponse,
} from '../model/requirement-traceability'

export function useUseCaseCoverage(projectId: string | null, query: CoverageListQuery) {
  const [data, setData] = useState<UseCaseCoverageListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      setData(await api.listUseCaseCoverage(projectId, query))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load use case coverage')
    } finally {
      setLoading(false)
    }
  }, [projectId, query.q, query.coverageStatus, query.limit, query.offset])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
