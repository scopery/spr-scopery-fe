'use client'

import { useCallback, useEffect, useState } from 'react'
import * as authSessionApi from '../../../auth/api/auth-session.api'
import type { AuthSessionItem } from '../../../auth/domain/model/auth-session'

export function useAccountSessions() {
  const [items, setItems] = useState<AuthSessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authSessionApi.listSessions()
      setItems(res)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = useCallback(
    async (sessionId: string) => {
      setActingId(sessionId)
      try {
        await authSessionApi.revokeSession(sessionId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [load]
  )

  return { items, loading, actingId, refetch: load, revoke }
}
