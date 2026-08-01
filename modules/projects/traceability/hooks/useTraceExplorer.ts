'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/requirement-traceability.api'
import type { TraceExplorerResponse } from '../model/requirement-traceability'

export function useTraceExplorer(
  projectId: string | null,
  rootType: string | null,
  rootId: string | null
) {
  const [data, setData] = useState<TraceExplorerResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !rootType || !rootId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setData(await api.getTraceExplorer(projectId, { rootType, rootId }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load explorer')
    } finally {
      setLoading(false)
    }
  }, [projectId, rootType, rootId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
