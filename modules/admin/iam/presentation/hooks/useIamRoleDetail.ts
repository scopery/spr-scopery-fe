'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamRolesApi, iamRoleAssignmentsApi } from '@/modules/auth/iam'
import type { IamRole, IamRoleAssignment, UpdateRolePayload } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamRoleDetail(roleId: string) {
  const [role, setRole] = useState<IamRole | null>(null)
  const [assignments, setAssignments] = useState<IamRoleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    if (!roleId) return
    setLoading(true)
    setError(null)
    try {
      const [roleData, assignmentsData] = await Promise.all([
        iamRolesApi.getRole(roleId),
        iamRoleAssignmentsApi.searchRoleAssignments({ roleId, page: 0, size: 100 }),
      ])
      setRole(roleData)
      setAssignments(assignmentsData.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load role'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [roleId])

  useEffect(() => {
    void load()
  }, [load])

  const updateRole = useCallback(
    async (payload: UpdateRolePayload) => {
      if (!roleId) return
      setUpdating(true)
      try {
        const updated = await iamRolesApi.updateRole(roleId, payload)
        setRole(updated)
        toast.success('Role updated')
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setUpdating(false)
      }
    },
    [roleId]
  )

  const runAssignmentAction = useCallback(
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

  return { role, assignments, loading, error, actingId, updating, refetch: load, updateRole, runAssignmentAction }
}
