'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as orgTeamsApi from '../api/org-teams.api'
import type { OrgTeam } from '../model'

export function useOrgTeams(organizationId: string | null) {
  const [items, setItems] = useState<OrgTeam[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    try {
      const res = await orgTeamsApi.searchOrgTeams(organizationId, {
        keyword: keyword.trim() || undefined,
        status: statusFilter,
        page: 0,
        size: 50,
      })
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }, [organizationId, keyword, statusFilter])

  return {
    items,
    totalElements,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    load,
    refetch: load,
  }
}
