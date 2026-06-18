'use client'

import { useCallback, useEffect, useState } from 'react'
import * as orgService from '@/services/org.service'
import type { OrgMember } from '@/services/org.service'

export function useOrgMembers(orgId: string | null) {
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await orgService.getOrgMembers(orgId, { limit: 200 })
      setMembers(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  const patchMember = useCallback(async (
    userId: string,
    body: { role?: 'owner' | 'member' | 'partner'; status?: 'removed' }
  ) => {
    if (!orgId) throw new Error('orgId is required')
    const updated = await orgService.patchOrgMember(orgId, userId, body)
    setMembers(prev => prev.map(m => m.user_id === userId ? updated : m))
    return updated
  }, [orgId])

  const removeMember = useCallback(async (userId: string) => {
    if (!orgId) throw new Error('orgId is required')
    await orgService.patchOrgMember(orgId, userId, { status: 'removed' })
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }, [orgId])

  const leave = useCallback(async () => {
    if (!orgId) throw new Error('orgId is required')
    await orgService.leaveOrg(orgId)
  }, [orgId])

  return { members, loading, error, refetch: load, patchMember, removeMember, leave }
}
