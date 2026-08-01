'use client'

import { useCallback, useEffect, useState } from 'react'
import * as requirementsApi from '../api/requirements.api'
import type {
  CreateRequirementPayload,
  Requirement,
  UpdateRequirementPayload,
} from '../model/requirements'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'

export function useRequirements(orgId: string | null, projectId: string | null) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await requirementsApi.listRequirements(orgId, projectId, { limit: 200 })
      setRequirements(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createRequirement = useCallback(
    async (body: CreateRequirementPayload, opts?: { quiet?: boolean }) => {
      if (!orgId || !projectId) return null
      const created = await requirementsApi.createRequirement(orgId, projectId, body)
      if (opts?.quiet) {
        setRequirements((prev) => [...prev, created])
      } else {
        await load()
      }
      return created
    },
    [orgId, projectId, load]
  )

  const updateRequirement = useCallback(
    async (requirementId: string, body: UpdateRequirementPayload) => {
      if (!orgId || !projectId) return null
      const updated = await requirementsApi.updateRequirement(
        orgId,
        projectId,
        requirementId,
        body
      )
      setRequirements((prev) =>
        prev.map((r) => (r.id === requirementId ? { ...r, ...updated } : r))
      )
      return updated
    },
    [orgId, projectId]
  )

  const submitRequirementsBulk = useCallback(
    async (items: CreateRequirementPayload[]): Promise<BulkJobResponse> => {
      if (!orgId || !projectId) throw new Error('Missing project context')
      return requirementsApi.submitRequirementsBulk(orgId, projectId, items)
    },
    [orgId, projectId]
  )

  return {
    requirements,
    loading,
    error,
    refetch: load,
    createRequirement,
    updateRequirement,
    submitRequirementsBulk,
  }
}
