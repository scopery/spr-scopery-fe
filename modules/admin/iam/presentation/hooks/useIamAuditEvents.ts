'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamAuditEventsApi } from '@/modules/auth/iam'
import type { IamAuditEvent } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

function normalizeAuditEventsResponse(
  value: unknown
): IamAuditEvent[] {
  if (Array.isArray(value)) return value as IamAuditEvent[]
  if (
    value &&
    typeof value === 'object' &&
    'items' in value &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    return (value as { items: IamAuditEvent[] }).items
  }
  return []
}

export function useIamAuditEvents() {
  const [items, setItems] = useState<IamAuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iamAuditEventsApi.listAuditEvents({ page: 0, size: 50 })
      setItems(normalizeAuditEventsResponse(res))
    } catch (err) {
      setItems([])
      const msg = err instanceof Error ? err.message : 'Failed to load audit events'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
