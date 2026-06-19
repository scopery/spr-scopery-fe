'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AIBudgetListItem, AIBudgetOverview } from '@/modules/admin/ai-budgets'
import * as aiBudgetsApi from '../api/ai-budgets.api'

export function useAiBudgets(orgId: string | null) {
  const [overview, setOverview] = useState<AIBudgetOverview | null>(null)
  const [items, setItems] = useState<AIBudgetListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, listRes] = await Promise.all([
        aiBudgetsApi.getBudgetOverview(orgId),
        aiBudgetsApi.listBudgets(orgId),
      ])
      setOverview(overviewRes)
      setItems(listRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI budgets')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  return { overview, items, loading, error, refetch: load }
}
