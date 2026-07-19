'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/portal.api'
import type { PortalSupportCase } from '../../domain/model/portal'

export function usePortalSupport(projectId: string | null) {
  const [items, setItems] = useState<PortalSupportCase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listPortalSupport(projectId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support cases')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
