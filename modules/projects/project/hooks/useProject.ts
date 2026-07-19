'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectsApi from '../api/projects.api'
import type { ProjectDetail } from '../model/project'

/** `workspaceId` kept for call-site compatibility; GET is by project id only. */
export function useProject(_workspaceId: string | null, projectId: string | null) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await projectsApi.getProject(projectId)
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return { project, loading, error, refetch: load }
}
