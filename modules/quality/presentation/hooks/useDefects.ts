'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/quality.api'
import type { Defect } from '../../domain/model/quality'

export function useDefects(projectId: string | null) {
  const [items, setItems] = useState<Defect[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDefects(projectId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load defects')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const close = useCallback(
    async (defectId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.closeDefect(projectId, defectId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Close failed')
      }
    },
    [projectId, load]
  )

  return { items, loading, error, actionError, refetch: load, close }
}
