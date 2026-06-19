'use client'

import { useCallback, useEffect, useState } from 'react'
import * as orgApi from '../api/org.api'
import type { OrgDetail } from '../model/org'

export function useOrg(orgId: string | null) {
  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const data = await orgApi.getOrg(orgId)
      setOrg(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load org')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  return { org, loading, error, refetch: load }
}
