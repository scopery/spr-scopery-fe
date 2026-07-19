'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamUsersApi } from '@/modules/auth/iam'
import type { IamUser } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useDebounce } from '@/utils/useDebounce'

export function useIamUsers() {
  const [items, setItems] = useState<IamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)

  const debouncedKeyword = useDebounce(keyword)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iamUsersApi.searchUsers({
        keyword: debouncedKeyword.trim() || undefined,
        status: statusFilter || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load users'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = useCallback(
    async (userId: string, action: 'activate' | 'deactivate' | 'suspend') => {
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
    [load]
  )

  return {
    items,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    actingId,
    refetch: load,
    runAction,
  }
}
