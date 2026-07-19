'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as platformApi from '../../infrastructure/api/platform-reliability.api'
import type {
  PlatformAuditEvent,
  SearchPlatformAuditEventsParams,
} from '../../domain/model/platform-reliability'

export function usePlatformAuditEvents(params?: SearchPlatformAuditEventsParams) {
  const [items, setItems] = useState<PlatformAuditEvent[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await platformApi.searchPlatformAuditEvents({
        page: 0,
        size: 50,
        ...params,
      })
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setItems([])
      setTotalElements(0)
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load audit events')
    } finally {
      setLoading(false)
    }
  }, [
    params?.eventType,
    params?.severity,
    params?.actorId,
    params?.resourceType,
    params?.organizationId,
    params?.workspaceId,
    params?.page,
    params?.size,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}
