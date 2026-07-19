'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/portal.api'
import type { PortalReview } from '../../domain/model/portal'

export function usePortalReviews(projectId: string | null) {
  const [items, setItems] = useState<PortalReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listPortalReviews(projectId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const decide = useCallback(
    async (
      reviewId: string,
      decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
      comment?: string
    ) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.decidePortalReview(projectId, reviewId, { decision, comment })
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Decision failed')
      }
    },
    [projectId, load]
  )

  return { items, loading, error, actionError, refetch: load, decide }
}
