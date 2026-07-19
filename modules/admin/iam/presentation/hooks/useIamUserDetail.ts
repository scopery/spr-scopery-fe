'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamUsersApi, iamRoleAssignmentsApi } from '@/modules/auth/iam'
import type { IamUser, IamRoleAssignment } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamUserDetail(userId: string) {
  const [user, setUser] = useState<IamUser | null>(null)
  const [assignments, setAssignments] = useState<IamRoleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [userData, assignmentsData] = await Promise.all([
        iamUsersApi.getUser(userId),
        iamRoleAssignmentsApi.searchRoleAssignments({ assigneeId: userId, page: 0, size: 100 }),
      ])
      setUser(userData)
      setAssignments(assignmentsData.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load user'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = useCallback(
    async (action: 'activate' | 'deactivate' | 'suspend') => {
      if (!userId) return
      setActingId(userId)
      try {
        if (action === 'activate') await iamUsersApi.activateUser(userId)
        else if (action === 'deactivate') await iamUsersApi.deactivateUser(userId)
        else await iamUsersApi.suspendUser(userId)
        toast.success('User updated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActingId(null)
      }
    },
    [userId, load]
  )

  return { user, assignments, loading, error, actingId, refetch: load, runAction }
}
