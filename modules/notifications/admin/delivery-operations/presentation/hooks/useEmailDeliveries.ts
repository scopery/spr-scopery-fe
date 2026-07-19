'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as deliveriesApi from '../../infrastructure/api/deliveries.api'
import type { EmailDelivery } from '../../domain/model/email-delivery'

export function useEmailDeliveries() {
  const [deliveries, setDeliveries] = useState<EmailDelivery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await deliveriesApi.searchDeliveries()
      setDeliveries(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load deliveries')
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { deliveries, loading, error, forbidden, refetch: load }
}
