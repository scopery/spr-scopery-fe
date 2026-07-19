'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as platformApi from '../../infrastructure/api/platform-reliability.api'
import type { PlatformAuditEvent } from '../../domain/model/platform-reliability'

export function usePlatformAuditEventDetail(eventId: string | null) {
  const [event, setEvent] = useState<PlatformAuditEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    try {
      const found = await platformApi.findPlatformAuditEvent(eventId)
      setEvent(found)
      if (!found) setError('Audit event not found in the latest search window.')
    } catch (err) {
      setEvent(null)
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load audit event')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  return { event, loading, error, refetch: load }
}
