'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/ai-recommendation.api'
import {
  recommendationRef,
  type AiRecommendation,
} from '../../domain/model/recommendation'

export function useAiRecommendations(projectId: string | null) {
  const [items, setItems] = useState<AiRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [prepareInfo, setPrepareInfo] = useState<{
    suggestionRef: string
    ready: boolean
    warnings?: string[]
  } | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listRecommendations({ projectId })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const accept = useCallback(
    async (item: AiRecommendation) => {
      setActionError(null)
      try {
        await api.acceptRecommendation(recommendationRef(item))
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Accept failed')
      }
    },
    [load]
  )

  const reject = useCallback(
    async (item: AiRecommendation) => {
      setActionError(null)
      try {
        await api.rejectRecommendation(recommendationRef(item))
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Reject failed')
      }
    },
    [load]
  )

  const prepareApply = useCallback(async (item: AiRecommendation) => {
    setActionError(null)
    setPrepareInfo(null)
    try {
      const res = await api.prepareApplyRecommendation(recommendationRef(item))
      setPrepareInfo(res)
      return res
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Prepare apply failed')
      return null
    }
  }, [])

  return {
    items,
    loading,
    error,
    actionError,
    prepareInfo,
    refetch: load,
    accept,
    reject,
    prepareApply,
  }
}
