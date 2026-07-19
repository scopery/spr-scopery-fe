'use client'

import { useCallback, useEffect, useState } from 'react'
import * as organizationsApi from '../../infrastructure/api/organizations.api'
import type { Organization } from '../../domain/model/organization'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useDebounce } from '@/utils/useDebounce'

export function useAdminOrganizations() {
  const [items, setItems] = useState<Organization[]>([])
  const [totalElements, setTotalElements] = useState(0)
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
      const res = await organizationsApi.searchOrganizations({
        keyword: debouncedKeyword.trim() || undefined,
        status: (statusFilter as Organization['status']) || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load organizations'
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
    async (orgId: string, action: 'activate' | 'archive') => {
      setActingId(orgId)
      try {
        if (action === 'activate') await organizationsApi.activateOrganization(orgId)
        else await organizationsApi.archiveOrganization(orgId)
        toast.success(action === 'activate' ? 'Organization activated' : 'Organization archived')
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
    actingId,
    refetch: load,
    runAction,
  }
}
