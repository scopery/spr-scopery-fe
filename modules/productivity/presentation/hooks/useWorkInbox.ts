'use client'

import { useCallback, useEffect, useState } from 'react'
import * as productivityApi from '../../infrastructure/api/productivity.api'
import type { WorkInboxItem } from '../../domain/model/work-inbox'

export function useWorkInbox(workspaceId: string | null) {
  const [items, setItems] = useState<WorkInboxItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await productivityApi.listWorkInbox(workspaceId)
      setItems(res.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const markRead = useCallback(
    async (itemId: string) => {
      if (!workspaceId) return
      await productivityApi.markWorkInboxRead(workspaceId, itemId)
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: 'READ', readAt: new Date().toISOString() } : i
        )
      )
    },
    [workspaceId]
  )

  return { items, loading, error, refetch: load, markRead }
}
