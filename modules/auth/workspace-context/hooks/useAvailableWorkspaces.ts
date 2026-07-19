'use client'

import { useCallback, useEffect, useState } from 'react'
import { listAvailableWorkspaces } from '../api/workspace-context.api'
import type { AvailableWorkspace } from '../model'

export function useAvailableWorkspaces() {
  const [items, setItems] = useState<AvailableWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listAvailableWorkspaces())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
