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
      const results = await Promise.allSettled([
        api.listPortalInvites(projectId),
        api.listPortalPermissionPolicies(workspaceId),
        api.listPortalAccessGrants(projectId),
        api.listClientReviews(projectId),
        api.listClientFeedback(projectId),
        api.listClientComments(projectId),
        api.listPortalAuditLogs(projectId),
      ])

      const value = <T,>(i: number, fallback: T): T => {
        const r = results[i]
        return r?.status === 'fulfilled' ? (r.value as T) : fallback
      }

      setInvites(value(0, { items: [] as PortalInvite[] }).items)
      setPolicies(value(1, { items: [] as PortalPermissionPolicy[] }).items)
      setGrants(value(2, { items: [] as PortalAccessGrant[] }).items)
      setReviews(value(3, { items: [] as ClientReviewItem[] }).items)
      setFeedback(value(4, { items: [] as ClientFeedbackItem[] }).items)
      setComments(value(5, { items: [] as ClientFeedbackItem[] }).items)
      setAuditLogs(
        value(6, { items: [] as Array<{ id: string; action?: string; createdAt?: string }> })
          .items
      )

      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed === results.length) {
        const first = results.find((r) => r.status === 'rejected') as PromiseRejectedResult
        setError(
          first.reason instanceof Error
            ? first.reason.message
            : 'Failed to load collaboration'
        )
      }
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
