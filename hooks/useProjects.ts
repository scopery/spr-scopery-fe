'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectService from '@/services/project.service'
import type { Project } from '@/types/project'

export function useProjects(orgId?: string | null) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listProjects = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectService.listProjects(id, { limit: 100 })
      setProjects(res.items as Project[])
      return res.items as Project[]
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load projects'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (orgId) listProjects(orgId)
  }, [orgId, listProjects])

  return { projects, loading, error, listProjects, refetch: () => orgId ? listProjects(orgId) : Promise.resolve() }
}
