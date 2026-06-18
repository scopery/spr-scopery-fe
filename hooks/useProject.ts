'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectService from '@/services/project.service'
import type { ProjectDetail } from '@/services/project.service'

export function useProject(orgId: string | null, projectId: string | null) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await projectService.getProject(orgId, projectId)
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => { load() }, [load])

  return { project, loading, error, refetch: load }
}
