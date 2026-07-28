'use client'

import { useCallback, useEffect, useState } from 'react'
import * as activityApi from '../api/workspace-activity.api'
import type { WorkspaceActivityFeedItem } from '../model/workspace-activity'
import { ApiError } from '@/shared/lib/api-types'

export function useWorkspaceActivityFeed(workspaceId: string | null, page = 0, size = 30) {
  const [items, setItems] = useState<WorkspaceActivityFeedItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await activityApi.listWorkspaceActivityFeed(workspaceId, { page, size })
      setItems(res.items ?? [])
      setTotalElements(res.totalElements ?? 0)
      setTotalPages(res.totalPages ?? 0)
    } catch (err) {
      setItems([])
      setTotalElements(0)
      setTotalPages(0)
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true)
        setError('You do not have permission to view workspace activity.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      }
    } finally {
      setLoading(false)
    }
  }, [workspaceId, page, size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, totalPages, loading, error, forbidden, refetch: load }
}
