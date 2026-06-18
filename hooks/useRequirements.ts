'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectService from '@/services/project.service'
import type { Requirement } from '@/services/project.service'

export function useRequirements(orgId: string | null, projectId: string | null) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await projectService.listRequirements(orgId, projectId, { limit: 200 })
      setRequirements(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => { load() }, [load])

  return { requirements, loading, error, refetch: load }
}
