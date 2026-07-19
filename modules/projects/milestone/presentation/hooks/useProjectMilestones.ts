'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as milestonesApi from '../../infrastructure/api/milestones.api'
import type { CreateMilestonePayload, Milestone } from '../../domain/model/milestone'

export function useProjectMilestones(projectId: string | null) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await milestonesApi.listMilestones(projectId)
      setMilestones(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load milestones')
      setMilestones([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createMilestone = useCallback(
    async (body: CreateMilestonePayload) => {
      if (!projectId) return null
      const created = await milestonesApi.createMilestone(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const achieve = useCallback(
    async (milestoneId: string) => {
      if (!projectId) return null
      const updated = await milestonesApi.achieveMilestone(projectId, milestoneId)
      await load()
      return updated
    },
    [projectId, load]
  )

  const archive = useCallback(
    async (milestoneId: string) => {
      if (!projectId) return null
      const updated = await milestonesApi.archiveMilestone(projectId, milestoneId)
      await load()
      return updated
    },
    [projectId, load]
  )

  return {
    milestones,
    loading,
    error,
    forbidden,
    refetch: load,
    createMilestone,
    achieve,
    archive,
  }
}
