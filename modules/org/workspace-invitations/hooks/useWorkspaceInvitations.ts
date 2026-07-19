'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as workspaceInvitationsApi from '../api/workspace-invitations.api'
import type { WorkspaceInvitation } from '../model'

export function useWorkspaceInvitations(workspaceId: string | null) {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInvitations = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const items = await workspaceInvitationsApi.listWorkspaceInvitations(workspaceId)
      setInvitations(items)
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  return { invitations, loading, error, loadInvitations }
}
