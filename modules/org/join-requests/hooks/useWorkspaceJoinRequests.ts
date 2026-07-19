'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as joinRequestsApi from '../api/join-requests.api'
import type { JoinRequest } from '../model'

export function useWorkspaceJoinRequests(workspaceId: string | null) {
  const [items, setItems] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const list = await joinRequestsApi.listJoinRequests(
        workspaceId,
        statusFilter ? { status: statusFilter } : undefined
      )
      setItems(list)
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load join requests')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, statusFilter])

  return { items, loading, error, statusFilter, setStatusFilter, load, refetch: load }
}
