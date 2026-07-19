'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/portal.api'
import type { PortalProject } from '../../domain/model/portal'

export function usePortalProjects() {
  const [items, setItems] = useState<PortalProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listPortalProjects()
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
