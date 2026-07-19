'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/portal-collab.api'
import type {
  ClientFeedbackItem,
  ClientReviewItem,
  PortalAccessGrant,
  PortalInvite,
  PortalPermissionPolicy,
} from '../../infrastructure/api/portal-collab.api'

export function useClientCollaboration(
  workspaceId: string | null,
  projectId: string | null
) {
  const [invites, setInvites] = useState<PortalInvite[]>([])
  const [policies, setPolicies] = useState<PortalPermissionPolicy[]>([])
  const [grants, setGrants] = useState<PortalAccessGrant[]>([])
  const [reviews, setReviews] = useState<ClientReviewItem[]>([])
  const [feedback, setFeedback] = useState<ClientFeedbackItem[]>([])
  const [comments, setComments] = useState<ClientFeedbackItem[]>([])
  const [auditLogs, setAuditLogs] = useState<
    Array<{ id: string; action?: string; createdAt?: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const [i, p, g, r, f, c, a] = await Promise.all([
        api.listPortalInvites(projectId),
        api.listPortalPermissionPolicies(workspaceId),
        api.listPortalAccessGrants(projectId),
        api.listClientReviews(projectId),
        api.listClientFeedback(projectId),
        api.listClientComments(projectId),
        api.listPortalAuditLogs(projectId),
      ])
      setInvites(i.items)
      setPolicies(p.items)
      setGrants(g.items)
      setReviews(r.items)
      setFeedback(f.items)
      setComments(c.items)
      setAuditLogs(a.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaboration')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const invite = useCallback(
    async (email: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.createPortalInvite(projectId, email)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Invite failed')
      }
    },
    [projectId, load]
  )

  const decideReview = useCallback(
    async (reviewId: string, decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.decideClientReview(projectId, reviewId, decision)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Decide failed')
      }
    },
    [projectId, load]
  )

  const revokeGrant = useCallback(
    async (grantId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.revokePortalAccessGrant(projectId, grantId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Revoke failed')
      }
    },
    [projectId, load]
  )

  const suspendAccount = useCallback(
    async (accountId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.suspendPortalAccount(workspaceId, accountId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Suspend failed')
      }
    },
    [workspaceId, load]
  )

  const deactivateAccount = useCallback(
    async (accountId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.deactivatePortalAccount(workspaceId, accountId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Deactivate failed')
      }
    },
    [workspaceId, load]
  )

  return {
    invites,
    policies,
    grants,
    reviews,
    feedback,
    comments,
    auditLogs,
    loading,
    error,
    actionError,
    refetch: load,
    invite,
    decideReview,
    revokeGrant,
    suspendAccount,
    deactivateAccount,
  }
}
