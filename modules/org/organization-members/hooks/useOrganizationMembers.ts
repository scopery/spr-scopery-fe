'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as organizationMembersApi from '../api/organization-members.api'
import type { OrganizationMember } from '../model/organization-member'

export function useOrganizationMembers(organizationId: string | null) {
  const [items, setItems] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    try {
      const res = await organizationMembersApi.listOrganizationMembers(organizationId, {
        status: statusFilter,
        page: 0,
        size: 100,
      })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [organizationId, statusFilter])

  return { items, loading, error, statusFilter, setStatusFilter, load, refetch: load }
}
