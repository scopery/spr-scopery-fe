'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamRightsApi } from '@/modules/auth/iam'
import type { IamRight } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useDebounce } from '@/utils/useDebounce'

export function useIamPermissions() {
  const [items, setItems] = useState<IamRight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')

  const debouncedKeyword = useDebounce(keyword)
  const debouncedModuleFilter = useDebounce(moduleFilter)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iamRightsApi.searchRights({
        keyword: debouncedKeyword.trim() || undefined,
        module: debouncedModuleFilter.trim() || undefined,
        page: 0,
        size: 200,
      })
      setItems(res.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load permissions'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, debouncedModuleFilter])

  useEffect(() => {
    void load()
  }, [load])

  return {
    items,
    loading,
    error,
    keyword,
    setKeyword,
    moduleFilter,
    setModuleFilter,
    refetch: load,
  }
}
