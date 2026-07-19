'use client'

import { useCallback, useEffect, useState } from 'react'
import * as profitabilityApi from '../../infrastructure/api/profitability.api'
import type {
  CreateProfitRateCardPayload,
  ProfitRateCard,
  UpdateProfitRateCardPayload,
} from '../../domain/model/profitability'

export type RateCardScope = 'workspace' | 'project'

export function useBillingRateCards(
  scope: RateCardScope,
  scopeId: string | null
) {
  const [cards, setCards] = useState<ProfitRateCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!scopeId) return
    setLoading(true)
    setError(null)
    try {
      const list =
        scope === 'workspace'
          ? await profitabilityApi.listWorkspaceRateCards(scopeId)
          : await profitabilityApi.listProjectRateCards(scopeId)
      setCards(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rate cards')
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [scope, scopeId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (body: CreateProfitRateCardPayload) => {
      if (!scopeId) return null
      const created =
        scope === 'workspace'
          ? await profitabilityApi.createWorkspaceRateCard(scopeId, body)
          : await profitabilityApi.createProjectRateCard(scopeId, body)
      await load()
      return created
    },
    [scope, scopeId, load]
  )

  const update = useCallback(
    async (id: string, body: UpdateProfitRateCardPayload) => {
      if (!scopeId || scope !== 'workspace') return null
      const updated = await profitabilityApi.updateWorkspaceRateCard(scopeId, id, body)
      await load()
      return updated
    },
    [scope, scopeId, load]
  )

  const archive = useCallback(
    async (id: string) => {
      if (!scopeId) return null
      const result =
        scope === 'workspace'
          ? await profitabilityApi.archiveWorkspaceRateCard(scopeId, id)
          : await profitabilityApi.archiveProjectRateCard(scopeId, id)
      await load()
      return result
    },
    [scope, scopeId, load]
  )

  return { cards, loading, error, refetch: load, create, update, archive }
}
