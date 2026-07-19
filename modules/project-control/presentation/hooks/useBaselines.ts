'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/project-control.api'
import type {
  CreateBaselinePayload,
  ProjectBaseline,
} from '../../domain/model/project-control'

export function useBaselines(projectId: string | null) {
  const [baselines, setBaselines] = useState<ProjectBaseline[]>([])
  const [current, setCurrent] = useState<ProjectBaseline | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [list, cur] = await Promise.all([
        api.listBaselines(projectId),
        api.getCurrentBaseline(projectId),
      ])
      setBaselines(list)
      setCurrent(cur)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load baselines')
      setBaselines([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (body: CreateBaselinePayload) => {
      if (!projectId) return null
      const created = await api.createBaseline(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const refresh = useCallback(
    async (baselineId: string) => {
      if (!projectId) return null
      const r = await api.refreshBaselineSnapshot(projectId, baselineId)
      await load()
      return r
    },
    [projectId, load]
  )

  const validate = useCallback(
    async (baselineId: string) => {
      if (!projectId) return null
      const r = await api.validateBaseline(projectId, baselineId)
      await load()
      return r
    },
    [projectId, load]
  )

  const approve = useCallback(
    async (baselineId: string) => {
      if (!projectId) return null
      const r = await api.approveBaseline(projectId, baselineId)
      await load()
      return r
    },
    [projectId, load]
  )

  const markCurrent = useCallback(
    async (baselineId: string) => {
      if (!projectId) return null
      const r = await api.markBaselineCurrent(projectId, baselineId)
      await load()
      return r
    },
    [projectId, load]
  )

  const archive = useCallback(
    async (baselineId: string) => {
      if (!projectId) return null
      const r = await api.archiveBaseline(projectId, baselineId)
      await load()
      return r
    },
    [projectId, load]
  )

  return {
    baselines,
    current,
    loading,
    error,
    forbidden,
    refetch: load,
    create,
    refresh,
    validate,
    approve,
    markCurrent,
    archive,
  }
}
