'use client'

import { useCallback, useEffect, useState } from 'react'
import * as adminAiService from '@/services/admin-ai.service'
import type { AiRun } from '@/types/ai'

export function useAiRunDetail(runId: string | null) {
  const [run, setRun] = useState<AiRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!runId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminAiService.getAiRun(runId)
      setRun(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI run')
    } finally {
      setLoading(false)
    }
  }, [runId])

  useEffect(() => { load() }, [load])

  return { run, loading, error, refetch: load }
}
