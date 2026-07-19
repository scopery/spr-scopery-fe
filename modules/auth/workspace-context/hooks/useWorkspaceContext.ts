'use client'

import { useCallback, useEffect, useState } from 'react'
import { getWorkspaceContext } from '../api/workspace-context.api'
import type { WorkspaceContextResponse } from '../model'

export function useWorkspaceContext() {
  const [data, setData] = useState<WorkspaceContextResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getWorkspaceContext())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace context')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
