'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { joinRequestsApi } from '@/modules/org'
import * as productivityApi from '../../infrastructure/api/productivity.api'
import type { MyOrgInvitation, WorkInboxItem } from '../../domain/model/work-inbox'

export function useWorkInbox(workspaceId: string | null) {
  const [items, setItems] = useState<WorkInboxItem[]>([])
  const [pendingInvites, setPendingInvites] = useState<MyOrgInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [inboxResult, invites] = await Promise.all([
        productivityApi.listWorkInbox(workspaceId).then(
          (inbox) => ({ ok: true as const, inbox }),
          (err: unknown) => ({ ok: false as const, err })
        ),
        productivityApi.listMyOrgInvitations().catch(() => [] as MyOrgInvitation[]),
      ])

      setPendingInvites(invites)

      if (inboxResult.ok) {
        setItems(inboxResult.inbox.items ?? [])
        return
      }

      // Personal org invites still work without WORK_INBOX_VIEW.
      setItems([])
      const err = inboxResult.err
      if (err instanceof ApiError && (err.status === 403 || err.problem.code === 'PRODUCTIVITY_ACCESS_DENIED')) {
        setError(
          invites.length > 0
            ? null
            : 'Work Inbox requires WORK_INBOX_VIEW on this workspace'
        )
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load inbox')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const markRead = useCallback(
    async (itemId: string) => {
      if (!workspaceId) return
      await productivityApi.markWorkInboxRead(workspaceId, itemId)
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: 'READ', readAt: new Date().toISOString() } : i
        )
      )
    },
    [workspaceId]
  )

  const acceptOrgInvite = useCallback(
    async (invitationId: string, inboxItemId?: string) => {
      setActingId(invitationId)
      try {
        await productivityApi.acceptMyOrgInvitation(invitationId)
        toast.success('Organization invitation accepted')
        setPendingInvites((prev) => prev.filter((i) => i.id !== invitationId))
        if (inboxItemId && workspaceId) {
          try {
            await productivityApi.markWorkInboxRead(workspaceId, inboxItemId)
          } catch {
            /* ignore */
          }
          setItems((prev) => prev.filter((i) => i.id !== inboxItemId))
        } else {
          setItems((prev) =>
            prev.filter(
              (i) => !(i.sourceType === 'ORG_INVITATION' && i.sourceId === invitationId)
            )
          )
        }
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActingId(null)
      }
    },
    [workspaceId]
  )

  const acceptWorkspaceInvite = useCallback(
    async (invitationId: string, inboxItemId?: string) => {
      setActingId(invitationId)
      try {
        await productivityApi.acceptMyWorkspaceInvitation(invitationId)
        toast.success('Workspace invitation accepted')
        if (inboxItemId && workspaceId) {
          try {
            await productivityApi.markWorkInboxRead(workspaceId, inboxItemId)
          } catch {
            /* ignore */
          }
          setItems((prev) => prev.filter((i) => i.id !== inboxItemId))
        } else {
          setItems((prev) =>
            prev.filter(
              (i) =>
                !(i.sourceType === 'WORKSPACE_INVITATION' && i.sourceId === invitationId)
            )
          )
        }
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActingId(null)
      }
    },
    [workspaceId]
  )

  const reviewJoinRequest = useCallback(
    async (requestId: string, decision: 'approve' | 'reject', inboxItemId: string) => {
      if (!workspaceId) return
      setActingId(requestId)
      try {
        if (decision === 'approve') {
          await joinRequestsApi.approveJoinRequest(workspaceId, requestId)
          toast.success('Join request approved')
        } else {
          await joinRequestsApi.rejectJoinRequest(workspaceId, requestId)
          toast.success('Join request rejected')
        }
        setItems((prev) => prev.filter((i) => i.id !== inboxItemId))
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActingId(null)
      }
    },
    [workspaceId]
  )

  return {
    items,
    pendingInvites,
    loading,
    error,
    actingId,
    refetch: load,
    markRead,
    acceptOrgInvite,
    acceptWorkspaceInvite,
    reviewJoinRequest,
  }
}
