'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as tasksApi from '../../infrastructure/api/tasks.api'
import type {
  CreateTaskPayload,
  ListTasksParams,
  ProjectTask,
  UpdateTaskPayload,
} from '../../domain/model/task'
import type { TaskLifecycleAction } from '../../domain/rules/task.rules'

export function useProjectTasks(projectId: string | null, filters?: ListTasksParams) {
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const filterKey = JSON.stringify(filters ?? {})

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const params: ListTasksParams = {
        page: 0,
        size: 100,
        ...(filters ?? {}),
      }
      const res = await tasksApi.listTasks(projectId, params)
      setTasks(res.items ?? [])
      setTotalElements(res.totalElements ?? res.items?.length ?? 0)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      setTasks([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey captures filters
  }, [projectId, filterKey])

  useEffect(() => {
    void load()
  }, [load])

  const createTask = useCallback(
    async (body: CreateTaskPayload) => {
      if (!projectId) return null
      const created = await tasksApi.createTask(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const updateTask = useCallback(
    async (taskId: string, body: UpdateTaskPayload) => {
      if (!projectId) return null
      const updated = await tasksApi.updateTask(projectId, taskId, body)
      await load()
      return updated
    },
    [projectId, load]
  )

  const assignTask = useCallback(
    async (taskId: string, inChargeUserId: string) => {
      if (!projectId) return null
      const updated = await tasksApi.assignTask(projectId, taskId, inChargeUserId)
      await load()
      return updated
    },
    [projectId, load]
  )

  const getTask = useCallback(
    async (taskId: string) => {
      if (!projectId) return null
      return tasksApi.getTask(projectId, taskId)
    },
    [projectId]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!projectId) return
      setActingId(taskId)
      try {
        await tasksApi.deleteTask(projectId, taskId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const runLifecycle = useCallback(
    async (taskId: string, action: TaskLifecycleAction) => {
      if (!projectId) return
      setActingId(taskId)
      try {
        if (action === 'start') await tasksApi.startTask(projectId, taskId)
        else if (action === 'block') await tasksApi.blockTask(projectId, taskId)
        else if (action === 'complete') await tasksApi.completeTask(projectId, taskId)
        else if (action === 'cancel') await tasksApi.cancelTask(projectId, taskId)
        else if (action === 'reopen') await tasksApi.reopenTask(projectId, taskId)
        else await tasksApi.archiveTask(projectId, taskId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  return {
    tasks,
    totalElements,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createTask,
    updateTask,
    assignTask,
    getTask,
    deleteTask,
    runLifecycle,
  }
}
