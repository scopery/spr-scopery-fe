'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectsApi from '../api/projects.api'
import type { Project } from '../model/project'

export function useProjects(workspaceId?: string | null) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listProjects = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectsApi.listProjects(id, { size: 100, page: 0 })
      setProjects(res.items)
      return res.items
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load projects'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (workspaceId) void listProjects(workspaceId)
  }, [workspaceId, listProjects])

  return {
    projects,
    loading,
    error,
    listProjects,
    refetch: () => (workspaceId ? listProjects(workspaceId) : Promise.resolve()),
  }
}
