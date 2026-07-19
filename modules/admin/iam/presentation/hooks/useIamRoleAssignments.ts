'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamRoleAssignmentsApi } from '@/modules/auth/iam'
import type { IamRoleAssignment } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamRoleAssignments() {
  const [assigneeId, setAssigneeId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [items, setItems] = useState<IamRoleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    assigneeType: 'USER',
    assigneeId: '',
    roleId: '',
    workspaceId: '',
  })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iamRoleAssignmentsApi.searchRoleAssignments({
        assigneeId: assigneeId.trim() || undefined,
        roleId: roleId.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load assignments'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [assigneeId, roleId])

  useEffect(() => {
    void load()
  }, [load])

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

  const create = useCallback(async () => {
    if (!form.assigneeId.trim() || !form.roleId.trim()) {
      toast.error('Assignee ID and role ID are required')
      return
    }
    setCreating(true)
    try {
      await iamRoleAssignmentsApi.createRoleAssignment({
        assigneeType: form.assigneeType,
        assigneeId: form.assigneeId.trim(),
        roleId: form.roleId.trim(),
        workspaceId: form.workspaceId.trim() || undefined,
      })
      toast.success('Role assigned')
      setShowCreate(false)
      setForm({ assigneeType: 'USER', assigneeId: '', roleId: '', workspaceId: '' })
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreating(false)
    }
  }, [form, load])

  return {
    items,
    loading,
    error,
    assigneeId,
    setAssigneeId,
    roleId,
    setRoleId,
    actingId,
    showCreate,
    setShowCreate,
    form,
    setForm,
    creating,
    refetch: load,
    runAction,
    create,
  }
}
