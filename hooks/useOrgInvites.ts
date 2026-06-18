'use client'

import { useCallback, useState } from 'react'
import * as orgInviteService from '@/services/org-invite.service'
import type { OrgInvite } from '@/services/org-invite.service'

export function useOrgInvites(orgId: string | null) {
  const [invites, setInvites] = useState<OrgInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInvites = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await orgInviteService.listInvites(orgId)
      setInvites(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  return { invites, loading, error, loadInvites }
}
