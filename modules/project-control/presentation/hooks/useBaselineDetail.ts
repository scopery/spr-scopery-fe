'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/project-control.api'
import type { ProjectBaseline } from '../../domain/model/project-control'

export type BaselineDetailTab =
  | 'summary'
  | 'snapshot'
  | 'validation'
  | 'sources'
  | 'compare'
  | 'metadata'

export function useBaselineDetail(projectId: string | null, baselineId: string | null) {
  const [tab, setTab] = useState<BaselineDetailTab>('summary')
  const [baseline, setBaseline] = useState<ProjectBaseline | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !baselineId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      setBaseline(await api.getBaseline(projectId, baselineId))
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load baseline')
      setBaseline(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, baselineId])

  useEffect(() => {
    void load()
  }, [load])

  const run = useCallback(
    async (fn: () => Promise<ProjectBaseline>) => {
      setBusy(true)
      try {
        const result = await fn()
        setBaseline(result)
        return result
      } finally {
        setBusy(false)
      }
    },
    []
  )

  const refresh = useCallback(async () => {
    if (!projectId || !baselineId) return null
    return run(() => api.refreshBaselineSnapshot(projectId, baselineId))
  }, [projectId, baselineId, run])

  const validate = useCallback(async () => {
    if (!projectId || !baselineId) return null
    return run(() => api.validateBaseline(projectId, baselineId))
  }, [projectId, baselineId, run])

  const approve = useCallback(async () => {
    if (!projectId || !baselineId) return null
    return run(() => api.approveBaseline(projectId, baselineId))
  }, [projectId, baselineId, run])

  const markCurrent = useCallback(async () => {
    if (!projectId || !baselineId) return null
    return run(() => api.markBaselineCurrent(projectId, baselineId))
  }, [projectId, baselineId, run])

  const archive = useCallback(async () => {
    if (!projectId || !baselineId) return null
    return run(() => api.archiveBaseline(projectId, baselineId))
  }, [projectId, baselineId, run])

  return {
    tab,
    setTab,
    baseline,
    loading,
    busy,
    error,
    forbidden,
    refetch: load,
    refresh,
    validate,
    approve,
    markCurrent,
    archive,
  }
}
