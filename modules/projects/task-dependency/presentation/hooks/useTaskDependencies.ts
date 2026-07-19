'use client'

import { useCallback, useEffect, useState } from 'react'
import * as taskDepApi from '../../infrastructure/api/task-dependencies.api'
import type { CreateTaskDependencyPayload, TaskDependency } from '../../domain/model/task-dependency'

export function useTaskDependencies(projectId: string | null, taskId: string | null) {
  const [deps, setDeps] = useState<TaskDependency[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !taskId) {
      setDeps([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [predecessors, successors] = await Promise.all([
        taskDepApi.listDependencies(projectId, { successorTaskId: taskId }).catch(() => []),
        taskDepApi.listDependencies(projectId, { predecessorTaskId: taskId }).catch(() => []),
      ])
      const seen = new Set<string>()
      const merged: TaskDependency[] = []
      for (const d of [...predecessors, ...successors]) {
        if (!seen.has(d.id)) {
          seen.add(d.id)
          merged.push(d)
        }
      }
      setDeps(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dependencies')
    } finally {
      setLoading(false)
    }
  }, [projectId, taskId])

  useEffect(() => {
    void load()
  }, [load])

  const createDep = useCallback(
    async (body: CreateTaskDependencyPayload) => {
      if (!projectId) return null
      const created = await taskDepApi.createDependency(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const removeDep = useCallback(
    async (dependencyId: string) => {
      if (!projectId) return
      await taskDepApi.deleteDependency(projectId, dependencyId)
      await load()
    },
    [projectId, load]
  )

  return { deps, loading, error, refetch: load, createDep, removeDep }
}
