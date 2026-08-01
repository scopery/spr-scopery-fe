'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as phasesApi from '../../infrastructure/api/phases.api'
import type {
  CreateProjectPhasePayload,
  ProjectPhase,
  UpdateProjectPhasePayload,
} from '../../domain/model/phase'
import type { PhaseLifecycleAction } from '../../domain/rules/phase.rules'

type LoadOpts = { silent?: boolean }
type CreateOpts = { refresh?: boolean }

export function useProjectPhases(projectId: string | null) {
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async (opts?: LoadOpts) => {
    if (!projectId) return
    if (!opts?.silent) {
      setLoading(true)
    }
    setError(null)
    setForbidden(false)
    try {
      const res = await phasesApi.listPhases(projectId, { page: 0, size: 100 })
      setPhases(res.items ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load phases')
      setPhases([])
    } finally {
      if (!opts?.silent) {
        setLoading(false)
      }
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createPhase = useCallback(
    async (body: CreateProjectPhasePayload, opts?: CreateOpts) => {
      if (!projectId) return null
      const created = await phasesApi.createPhase(projectId, body)
      if (opts?.refresh !== false) {
        await load({ silent: true })
      }
      return created
    },
    [projectId, load]
  )

  const submitPhasesBulk = useCallback(
    async (items: CreateProjectPhasePayload[]) => {
      if (!projectId) throw new Error('Project required')
      return phasesApi.submitPhasesBulk(projectId, items)
    },
    [projectId]
  )

  const updatePhase = useCallback(
    async (phaseId: string, body: UpdateProjectPhasePayload) => {
      if (!projectId) return null
      const updated = await phasesApi.updatePhase(projectId, phaseId, body)
      await load({ silent: true })
      return updated
    },
    [projectId, load]
  )

  const runLifecycle = useCallback(
    async (phaseId: string, action: PhaseLifecycleAction) => {
      if (!projectId) return
      setActingId(phaseId)
      try {
        if (action === 'activate') await phasesApi.activatePhase(projectId, phaseId)
        else if (action === 'complete') await phasesApi.completePhase(projectId, phaseId)
        else await phasesApi.archivePhase(projectId, phaseId)
        await load({ silent: true })
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  return {
    phases,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createPhase,
    submitPhasesBulk,
    updatePhase,
    runLifecycle,
  }
}
