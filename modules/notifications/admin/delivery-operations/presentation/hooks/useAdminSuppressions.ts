'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as adminSuppressionsApi from '../../infrastructure/api/admin-suppressions.api'
import type { AdminSuppression } from '../../domain/model/admin-suppression'

export function useAdminSuppressions() {
  const [suppressions, setSuppressions] = useState<AdminSuppression[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await adminSuppressionsApi.listAdminSuppressions()
      setSuppressions(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load suppressions')
      setSuppressions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { suppressions, loading, error, forbidden, refetch: load }
}
