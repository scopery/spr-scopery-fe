'use client'

import { useCallback, useState } from 'react'
import * as orgInvitesApi from '../api/org-invites.api'
import type { OrgInvite } from '../model/org-invite'

export function useOrgInvites(orgId: string | null) {
  const [invites, setInvites] = useState<OrgInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInvites = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await orgInvitesApi.listInvites(orgId)
      setInvites(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  return { invites, loading, error, loadInvites }
}
