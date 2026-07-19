'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/quality.api'
import type { QualityPlan } from '../../domain/model/quality'

export function useQualityCenter(scopeId: string | null) {
  const [items, setItems] = useState<QualityPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!scopeId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listQualityPlans(scopeId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [scopeId])

  useEffect(() => {
    void load()
  }, [load])

  const approve = useCallback(
    async (planId: string) => {
      if (!scopeId) return
      setActionError(null)
      try {
        await api.approveQualityPlan(scopeId, planId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Approve failed')
      }
    },
    [scopeId, load]
  )

  const markCurrent = useCallback(
    async (planId: string) => {
      if (!scopeId) return
      setActionError(null)
      try {
        await api.markQualityPlanCurrent(scopeId, planId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Mark current failed')
      }
    },
    [scopeId, load]
  )

  return { items, loading, error, actionError, refetch: load, approve, markCurrent }
}
