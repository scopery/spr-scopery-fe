'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectsApi from '../api/projects.api'
import type { ProjectDetail } from '../model/project'

export function useProject(orgId: string | null, projectId: string | null) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await projectsApi.getProject(orgId, projectId)
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { project, loading, error, refetch: load }
}
