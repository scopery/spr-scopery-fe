'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as cardsApi from '../../infrastructure/api/cards.api'
import type { CreateRateCardPayload, RateCard } from '../../domain/model/rate-card'
import { RateCardScope } from '../../domain/enums/rate-card.enum'

export interface CreateRateCardFormPayload {
  code: string
  name: string
  description?: string
  scope: string
  defaultCurrencyCode: string
  isDefault?: boolean
}

/** Workspace-scoped rate card library: list + create wizard. */
export function useRateCardLibrary(workspaceId: string | null) {
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await cardsApi.listRateCards({ workspaceId, size: 100 })
      setRateCards(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rate cards')
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRateCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rateCards
    return rateCards.filter(
      (card) => card.name.toLowerCase().includes(q) || card.code.toLowerCase().includes(q)
    )
  }, [rateCards, search])

  const createRateCard = useCallback(
    async (payload: CreateRateCardFormPayload) => {
      if (!workspaceId) return
      setCreating(true)
      try {
        const body: CreateRateCardPayload = {
          ...payload,
          scope: payload.scope || RateCardScope.Workspace,
          workspaceId,
        }
        const created = await cardsApi.createRateCard(body)
        toast.success('Rate card created')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreating(false)
      }
    },
    [workspaceId, load]
  )

  const activateRateCard = useCallback(
    async (rateCardId: string) => {
      try {
        await cardsApi.activateRateCard(rateCardId)
        toast.success('Rate card activated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  const archiveRateCard = useCallback(
    async (rateCardId: string) => {
      try {
        await cardsApi.archiveRateCard(rateCardId)
        toast.success('Rate card archived')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  return {
    rateCards: filteredRateCards,
    allRateCards: rateCards,
    loading,
    error,
    creating,
    search,
    setSearch,
    createRateCard,
    activateRateCard,
    archiveRateCard,
    refetch: load,
  }
}
