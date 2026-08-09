'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/role-contributions.api'
import type {
  CreateTaskRoleContributionPayload,
  TaskRoleContribution,
} from '../../domain/model/task-role-contribution'

export function useTaskRoleContributions(projectId: string, taskId: string | null) {
  const [items, setItems] = useState<TaskRoleContribution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.listTaskRoleContributions(projectId, taskId)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contributions')
    } finally {
      setLoading(false)
    }
  }, [projectId, taskId])

  useEffect(() => {
    void load()
  }, [load])

  const add = useCallback(
    async (payload: CreateTaskRoleContributionPayload) => {
      if (!taskId) return
      await api.createTaskRoleContribution(projectId, taskId, payload)
      await load()
    },
    [projectId, taskId, load]
  )

  const remove = useCallback(
    async (id: string) => {
      if (!taskId) return
      await api.deleteTaskRoleContribution(projectId, taskId, id)
      await load()
    },
    [projectId, taskId, load]
  )

  return { items, loading, error, add, remove, refetch: load }
}
