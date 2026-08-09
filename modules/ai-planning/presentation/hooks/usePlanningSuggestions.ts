'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/ai-planning.api'
import type { AiPlanningSuggestion } from '../../domain/model/planning'

export interface SuggestionApplyPreview {
  fields: Array<{ path: string; label: string; before: string | null; after: string | null }>
  requiresChangeRequest?: boolean
}

export function usePlanningSuggestions(projectId: string | null, runId: string | null) {
  const [items, setItems] = useState<AiPlanningSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !runId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listSuggestions(projectId)
      setItems(res.items.filter((s) => s.planningRunId === runId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }, [projectId, runId])

  useEffect(() => {
    void load()
  }, [load])

  /** Preview endpoint not wired yet — UI falls back to a local status diff. */
  const previewApply = useCallback(
    async (_suggestionId: string): Promise<SuggestionApplyPreview | null> => null,
    []
  )

  const apply = useCallback(
    async (suggestionId: string) => {
      if (!projectId) return null
      setActionError(null)
      try {
        const res = await api.applySuggestion(projectId, suggestionId)
        await load()
        return res
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Apply failed')
        return null
      }
    },
    [projectId, load]
  )

  const accept = useCallback(
    async (suggestionId: string) => {
      if (!projectId) return
      await api.acceptSuggestion(projectId, suggestionId)
      await load()
    },
    [projectId, load]
  )

  return { items, loading, error, actionError, refetch: load, previewApply, apply, accept }
}
