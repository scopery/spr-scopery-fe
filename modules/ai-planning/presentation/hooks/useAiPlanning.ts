'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/ai-planning.api'
import type { AiPlanningRun } from '../../domain/model/planning'

export function useAiPlanning(projectId: string | null) {
  const [items, setItems] = useState<AiPlanningRun[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listPlanningRuns(projectId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load planning runs')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
