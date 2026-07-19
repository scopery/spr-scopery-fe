'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as workspaceMembersApi from '../api/workspace-members.api'
import type { WorkspaceMember } from '../model'

export function useWorkspaceMembers(workspaceId: string | null) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await workspaceMembersApi.listWorkspaceMembers(workspaceId, {
        page: 0,
        size: 200,
      })
      setMembers(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const deactivateMember = useCallback(
    async (memberId: string) => {
      if (!workspaceId) throw new Error('workspaceId is required')
      const updated = await workspaceMembersApi.deactivateWorkspaceMember(workspaceId, memberId)
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)))
      return updated
    },
    [workspaceId]
  )

  return { members, loading, error, refetch: load, deactivateMember }
}
