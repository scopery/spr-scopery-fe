'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as workspaceApi from '../api/workspace.api'
import type { WorkspaceDetail } from '../model'

export function useWorkspace(workspaceId: string | null) {
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      setWorkspace(await workspaceApi.getWorkspace(workspaceId))
    } catch (err) {
      setWorkspace(null)
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { workspace, loading, error, refetch: load }
}
