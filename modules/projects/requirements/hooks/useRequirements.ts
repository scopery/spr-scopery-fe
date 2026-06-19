'use client'

import { useCallback, useEffect, useState } from 'react'
import * as requirementsApi from '../api/requirements.api'
import type { Requirement } from '../model/requirements'

export function useRequirements(orgId: string | null, projectId: string | null) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await requirementsApi.listRequirements(orgId, projectId, { limit: 200 })
      setRequirements(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { requirements, loading, error, refetch: load }
}
