'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as outboxApi from '../../infrastructure/api/outbox.api'
import type { EmailOutbox } from '../../domain/model/email-outbox'

export function useEmailOutbox() {
  const [outbox, setOutbox] = useState<EmailOutbox[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await outboxApi.searchOutbox()
      setOutbox(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load outbox')
      setOutbox([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const retry = useCallback(async (recordId: string) => {
    setActingId(recordId)
    try {
      const updated = await outboxApi.retryOutbox(recordId)
      setOutbox((prev) => prev.map((r) => (r.id === recordId ? updated : r)))
      return updated
    } finally {
      setActingId(null)
    }
  }, [])

  const cancel = useCallback(async (recordId: string) => {
    setActingId(recordId)
    try {
      const updated = await outboxApi.cancelOutbox(recordId)
      setOutbox((prev) => prev.map((r) => (r.id === recordId ? updated : r)))
      return updated
    } finally {
      setActingId(null)
    }
  }, [])

  return { outbox, loading, error, forbidden, actingId, refetch: load, retry, cancel }
}
