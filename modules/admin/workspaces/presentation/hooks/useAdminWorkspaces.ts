'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import * as workspacesApi from '../../infrastructure/api/workspaces.api'
import type { Workspace } from '../../domain/model/workspace'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useDebounce } from '@/utils/useDebounce'

export function useAdminWorkspaces() {
  const searchParams = useSearchParams()
  const initialOrgId = searchParams.get('organizationId') ?? ''

  const [items, setItems] = useState<Workspace[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [organizationId, setOrganizationId] = useState(initialOrgId)
  const [actingId, setActingId] = useState<string | null>(null)

  const debouncedKeyword = useDebounce(keyword)

  useEffect(() => {
    setOrganizationId(initialOrgId)
  }, [initialOrgId])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await workspacesApi.searchWorkspaces({
        keyword: debouncedKeyword.trim() || undefined,
        status: (statusFilter as Workspace['status']) || undefined,
        organizationId: organizationId.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load workspaces'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, statusFilter, organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = useCallback(
    async (workspaceId: string, action: 'activate' | 'archive') => {
      setActingId(workspaceId)
      try {
        if (action === 'activate') await workspacesApi.activateWorkspace(workspaceId)
        else await workspacesApi.archiveWorkspace(workspaceId)
        toast.success(action === 'activate' ? 'Workspace activated' : 'Workspace archived')
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
    totalElements,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    organizationId,
    setOrganizationId,
    actingId,
    refetch: load,
    runAction,
  }
}
