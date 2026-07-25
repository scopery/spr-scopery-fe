'use client'

import { useCallback, useEffect, useState } from 'react'
import * as requirementsApi from '../api/requirements.api'
import type { CreateRequirementPayload, Requirement } from '../model/requirements'

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

  return { requirements, loading, error, refetch: load, createRequirement }
}
