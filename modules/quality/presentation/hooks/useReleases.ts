'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/quality.api'
import type { CreateReleasePayload, ReleasePackage } from '../../domain/model/quality'

export function useReleases(projectId: string | null) {
  const [items, setItems] = useState<ReleasePackage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<
    Record<string, { ready: boolean; blockers?: string[] }>
  >({})

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listReleases(projectId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load releases')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (body: CreateReleasePayload) => {
      if (!projectId) return
      await api.createRelease(projectId, body)
    },
    [projectId]
  )

  const checkReadiness = useCallback(
    async (releaseId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        const res = await api.checkReleaseReadiness(projectId, releaseId)
        setReadiness((prev) => ({ ...prev, [releaseId]: res }))
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Readiness check failed')
      }
    },
    [projectId]
  )

  const markReady = useCallback(
    async (releaseId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.markReleaseReady(projectId, releaseId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Mark ready failed')
      }
    },
    [projectId, load]
  )

  const markAsReleased = useCallback(
    async (releaseId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.markReleased(projectId, releaseId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Mark released failed')
      }
    },
    [projectId, load]
  )

  return {
    items,
    loading,
    error,
    actionError,
    readiness,
    refetch: load,
    create,
    checkReadiness,
    markReady,
    markAsReleased,
  }
}
