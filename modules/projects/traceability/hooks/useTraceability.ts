'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/traceability.api'
import type { CoverageMatrixCell, TraceLink } from '../api/traceability.api'

export function useTraceabilityMatrix(projectId: string | null) {
  const [cells, setCells] = useState<CoverageMatrixCell[]>([])
  const [links, setLinks] = useState<TraceLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [matrix, linkRes] = await Promise.all([
        api.getCoverageMatrix(projectId),
        api.listTraceLinks(projectId),
      ])
      setCells(matrix.items ?? [])
      setLinks(linkRes.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traceability')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { cells, links, loading, error, refetch: load }
}

export function useApplicationRegistry(workspaceId: string | null) {
  const [items, setItems] = useState<api.ApplicationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listApplications(workspaceId)
      setItems(res.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (name: string, code: string) => {
      if (!workspaceId) return
      await api.createApplication(workspaceId, { name, code })
      await load()
    },
    [workspaceId, load]
  )

  return { items, loading, error, refetch: load, create }
}
