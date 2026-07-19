'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamRoleAssignmentsApi, iamRolesApi } from '@/modules/auth/iam'
import type { IamRoleAssignment, IamRole, CreateRoleAssignmentPayload } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useWorkspaceAccess(workspaceId: string) {
  const [assignments, setAssignments] = useState<IamRoleAssignment[]>([])
  const [roles, setRoles] = useState<IamRole[]>([])
  const [loading, setLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await iamRoleAssignmentsApi.searchRoleAssignments({
        workspaceId,
        page: 0,
        size: 100,
      })
      setAssignments(res.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load workspace access'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  const loadRoles = useCallback(async () => {
    if (!workspaceId || roles.length > 0) return
    setRolesLoading(true)
    try {
      const res = await iamRolesApi.searchRoles({ workspaceId, page: 0, size: 100 })
      setRoles(res.items)
    } catch {
      // roles are optional for the create form
    } finally {
      setRolesLoading(false)
    }
  }, [workspaceId, roles.length])

  useEffect(() => {
    void load()
    void loadRoles()
  }, [load, loadRoles])

  const createAssignment = useCallback(
    async (payload: CreateRoleAssignmentPayload) => {
      setCreating(true)
      try {
        await iamRoleAssignmentsApi.createRoleAssignment(payload)
        toast.success('Role assigned')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreating(false)
      }
    },
    [load]
  )

  const runAction = useCallback(
    async (id: string, action: 'activate' | 'deactivate') => {
      setActingId(id)
      try {
        if (action === 'activate') await iamRoleAssignmentsApi.activateRoleAssignment(id)
        else await iamRoleAssignmentsApi.deactivateRoleAssignment(id)
        toast.success('Assignment updated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActingId(null)
      }
    },
    [load]
  )

  return {
    assignments,
    roles,
    loading,
    rolesLoading,
    error,
    actingId,
    creating,
    refetch: load,
    createAssignment,
    runAction,
  }
}
