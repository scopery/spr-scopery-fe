'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AiConfig, AiRun, AiRunsListRequest } from '../model/ai'
import * as adminAiApi from '../api/admin-ai.api'

export function useAdminAiConfigs() {
  const [configs, setConfigs] = useState<AiConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminAiApi.listAiConfigs()
      setConfigs(res.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI configs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { configs, loading, error, refetch: load }
}

type PageInfo = { limit: number; offset: number; total: number }

export function useAdminAiRuns() {
  const [runs, setRuns] = useState<AiRun[]>([])
  const [page, setPage] = useState<PageInfo>({ limit: 50, offset: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRuns = useCallback(async (params?: AiRunsListRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminAiApi.listAiRuns(params)
      setRuns(res.items ?? [])
      setPage(res.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI runs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRuns()
  }, [loadRuns])

  return { runs, page, loading, error, loadRuns }
}
