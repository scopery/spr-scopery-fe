'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../../api/traceability.api'
import type { ScreenComponentLink } from '../../../model/overall-structure'

export function useScreenComponents(workspaceId: string | null, screenId: string | null) {
  const [items, setItems] = useState<ScreenComponentLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !screenId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listScreenComponents(workspaceId, screenId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load linked components')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, screenId])

  useEffect(() => {
    void load()
  }, [load])

  const unlink = useCallback(
    async (componentId: string) => {
      if (!workspaceId || !screenId) return
      await api.unlinkScreenComponent(workspaceId, screenId, componentId)
      await load()
    },
    [workspaceId, screenId, load]
  )

  return { items, loading, error, refetch: load, unlink }
}
