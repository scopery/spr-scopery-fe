'use client'

import { useCallback, useEffect, useState } from 'react'
import * as sessionService from '@/services/session.service'
import type { SessionListItem } from '@/services/session.service'

export function useSessions(orgId: string | null, projectId: string | null) {
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await sessionService.listSessions(orgId, projectId)
      setSessions(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => { load() }, [load])

  return { sessions, loading, error, refetch: load }
}
