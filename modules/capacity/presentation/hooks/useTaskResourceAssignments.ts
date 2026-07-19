'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as assignmentsApi from '../../infrastructure/api/task-assignments.api'
import * as catalogApi from '../../infrastructure/api/resource-catalog.api'
import * as workspaceMembersApi from '@/modules/org/workspace/api/workspace-members.api'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import type {
  CreateTaskResourceAssignmentPayload,
  TaskResourceAssignment,
} from '../../domain/model/task-assignment'
import type { ResourceRole } from '../../domain/model/resource-catalog'

export function useTaskResourceAssignments(
  projectId: string | null,
  taskId: string | null,
  workspaceId: string | null
) {
  const [items, setItems] = useState<TaskResourceAssignment[]>([])
  const [roles, setRoles] = useState<ResourceRole[]>([])
  const [members, setMembers] = useState<{ id: string; userId: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { labelFor } = useResolveUsers(memberUserIds)

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
    void Promise.all([
      catalogApi.listResourceRoles(workspaceId),
      workspaceMembersApi.listWorkspaceMembers(workspaceId, { page: 0, size: 100 }),
    ]).then(([roleList, memberRes]) => {
      setRoles(roleList)
      setMembers(memberRes.items.map((m) => ({ id: m.id, userId: m.userId })))
    })
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

  const memberLabel = useCallback(
    (memberId: string) => {
      const m = members.find((x) => x.id === memberId)
      return m ? labelFor(m.userId) : memberId.slice(0, 8)
    },
    [members, labelFor]
  )

  const roleLabel = useCallback(
    (roleId: string | null) => {
      if (!roleId) return '—'
      return roles.find((r) => r.id === roleId)?.name ?? roleId.slice(0, 8)
    },
    [roles]
  )

  return {
    items,
    roles,
    members,
    loading,
    error,
    saving,
    refetch: load,
    addAssignment,
    removeAssignment,
    memberLabel,
    roleLabel,
  }
}
