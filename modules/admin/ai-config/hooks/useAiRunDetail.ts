'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AiRun } from '@/modules/admin/ai-config'
import * as adminAiApi from '../api/admin-ai.api'

export function useAiRunDetail(runId: string | null) {
  const [run, setRun] = useState<AiRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!runId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminAiApi.getAiRun(runId)
      setRun(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI run')
    } finally {
      setLoading(false)
    }
  }, [runId])

  useEffect(() => {
    void load()
  }, [load])

  return { run, loading, error, refetch: load }
}
