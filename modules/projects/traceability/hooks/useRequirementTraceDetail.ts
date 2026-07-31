'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/requirement-traceability.api'
import type { RequirementTraceDetailResponse } from '../model/requirement-traceability'

export function useRequirementTraceDetail(projectId: string | null, requirementId: string | null) {
  const [data, setData] = useState<RequirementTraceDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !requirementId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const detail = await api.getRequirementTraceDetail(projectId, requirementId)
      setData(detail)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load requirement trace')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, requirementId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
