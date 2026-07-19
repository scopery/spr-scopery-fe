'use client'

import { useCallback, useEffect, useState } from 'react'
import * as overviewApi from '../../infrastructure/api/overview.api'

export type OverviewCounts = Awaited<
  ReturnType<typeof overviewApi.fetchAiControlOverviewCounts>
>

export function useAiControlOverview() {
  const [counts, setCounts] = useState<OverviewCounts | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await overviewApi.fetchAiControlOverviewCounts()
      setCounts(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { counts, loading, error, refetch: load }
}
