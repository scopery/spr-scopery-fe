'use client'

import { useCallback, useEffect, useState } from 'react'
import * as assignmentsApi from '../../infrastructure/api/task-assignments.api'
import * as resourcesApi from '../../infrastructure/api/resources.api'
import type {
  CreateTaskResourceAssignmentPayload,
  TaskResourceAssignment,
} from '../../domain/model/task-assignment'
import type { ResourceProfile } from '../../domain/model/resource-profile'
import { ResourceProfileStatus } from '../../domain/enums/capacity.enum'

export function useTaskResourceAssignments(
  projectId: string | null,
  taskId: string | null,
  workspaceId: string | null
) {
  const [items, setItems] = useState<TaskResourceAssignment[]>([])
  const [profiles, setProfiles] = useState<ResourceProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !taskId) return
    setLoading(true)
    setError(null)
    try {
      const list = await assignmentsApi.listTaskResourceAssignments(projectId, taskId)
      setItems(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [projectId, taskId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!workspaceId) return
    void resourcesApi
      .listResourceProfiles(workspaceId)
      .then((list) =>
        setProfiles(
          list.filter(
            (p) =>
              !p.status ||
              p.status === ResourceProfileStatus.Active ||
              String(p.status).toUpperCase() === 'ACTIVE'
          )
        )
      )
      .catch(() => setProfiles([]))
  }, [workspaceId])

  const addAssignment = useCallback(
    async (body: CreateTaskResourceAssignmentPayload) => {
      if (!projectId || !taskId) return
      setSaving(true)
      try {
        await assignmentsApi.createTaskResourceAssignment(projectId, taskId, body)
        await load()
      } finally {
        setSaving(false)
      }
    },
    [projectId, taskId, load]
  )

  const removeAssignment = useCallback(
    async (assignmentId: string) => {
      if (!projectId || !taskId) return
      await assignmentsApi.deleteTaskResourceAssignment(projectId, taskId, assignmentId)
      await load()
    },
    [projectId, taskId, load]
  )

  const profileLabel = useCallback(
    (profileId: string) => {
      const p = profiles.find((x) => x.id === profileId)
      return p?.displayName ?? 'Resource'
    },
    [profiles]
  )

  return {
    items,
    profiles,
    loading,
    error,
    saving,
    refetch: load,
    addAssignment,
    removeAssignment,
    profileLabel,
  }
}
