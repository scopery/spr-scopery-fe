'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamRolesApi } from '@/modules/auth/iam'
import type { IamRole, CreateSystemRolePayload } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useDebounce } from '@/utils/useDebounce'

export function useIamRoles() {
  const [items, setItems] = useState<IamRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const debouncedKeyword = useDebounce(keyword)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iamRolesApi.searchRoles({
        keyword: debouncedKeyword.trim() || undefined,
        roleScope: scopeFilter || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load roles'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, scopeFilter])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = useCallback(
    async (roleId: string, action: 'activate' | 'deactivate' | 'softDelete') => {
      setActingId(roleId)
      try {
        if (action === 'activate') await iamRolesApi.activateRole(roleId)
        else if (action === 'deactivate') await iamRolesApi.deactivateRole(roleId)
        else await iamRolesApi.softDeleteRole(roleId)
        toast.success('Role updated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActingId(null)
      }
    },
    [load]
  )

  const createSystemRole = useCallback(
    async (payload: CreateSystemRolePayload) => {
      setCreating(true)
      try {
        await iamRolesApi.createSystemRole(payload)
        toast.success('System role created')
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

  return {
    items,
    loading,
    error,
    keyword,
    setKeyword,
    scopeFilter,
    setScopeFilter,
    actingId,
    creating,
    refetch: load,
    runAction,
    createSystemRole,
  }
}
