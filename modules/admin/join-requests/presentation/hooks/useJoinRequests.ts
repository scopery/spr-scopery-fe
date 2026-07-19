'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as joinRequestsApi from '../../infrastructure/api/join-requests.api'
import type { JoinRequest } from '../../domain/model/join-request'

export function useJoinRequests(workspaceId: string | null, params?: { status?: string }) {
  const [items, setItems] = useState<JoinRequest[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await joinRequestsApi.listJoinRequests(workspaceId, params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load join requests')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, params?.status])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}
