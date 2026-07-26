'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/project-control.api'
import type {
  BaselineCompareResponse,
  ProjectBaseline,
} from '../../domain/model/project-control'
import type { BaselineViewMode } from '../../domain/rules/project-control.rules'

export type { BaselineViewMode }

export function useBaselineDetail(projectId: string | null, baselineId: string | null) {
  const [viewMode, setViewMode] = useState<BaselineViewMode>('baseline')
  const [baseline, setBaseline] = useState<ProjectBaseline | null>(null)
  const [compare, setCompare] = useState<BaselineCompareResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
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

  const loadCompare = useCallback(async () => {
    if (!projectId || !baselineId) return
    // Only fetch when user opens Current / Difference (endpoint may be missing on older BE).
    if (viewMode !== 'current' && viewMode !== 'difference') return
    setCompareLoading(true)
    setCompareError(null)
    try {
      setCompare(await api.compareBaselineToCurrent(projectId, baselineId))
    } catch (err) {
      setCompare(null)
      if (err instanceof ApiError && (err.status === 404 || err.status === 500)) {
        setCompareError(
          'Comparison with the current plan isn’t available yet. Please try again later.'
        )
      } else {
        setCompareError(err instanceof Error ? err.message : 'Failed to compare baseline')
      }
    } finally {
      setCompareLoading(false)
    }
  }, [projectId, baselineId, viewMode])

  useEffect(() => {
    void loadCompare()
  }, [loadCompare])

  const run = useCallback(async (fn: () => Promise<ProjectBaseline>) => {
    setBusy(true)
    try {
      const result = await fn()
      setBaseline(result)
      return result
    } finally {
      setBusy(false)
    }
  }, [])

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
    viewMode,
    setViewMode,
    baseline,
    compare,
    loading,
    compareLoading,
    busy,
    error,
    compareError,
    forbidden,
    refetch: load,
    refetchCompare: loadCompare,
    refresh,
    validate,
    approve,
    markCurrent,
    archive,
  }
}
