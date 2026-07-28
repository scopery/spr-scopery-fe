'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { useWorkInbox } from '../hooks/useWorkInbox'

export function WorkInboxView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    items,
    pendingInvites,
    loading,
    error,
    actingId,
    markRead,
    acceptOrgInvite,
    acceptWorkspaceInvite,
    reviewJoinRequest,
  } = useWorkInbox(workspaceId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  const inviteIdsFromInbox = new Set(
    items
      .filter((i) => i.sourceType === 'ORG_INVITATION' && i.sourceId)
      .map((i) => i.sourceId)
  )
  const standaloneInvites = pendingInvites.filter((inv) => !inviteIdsFromInbox.has(inv.id))
  const hasContent = items.length > 0 || standaloneInvites.length > 0

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Work Inbox</Typography>
      {!hasContent ? (
        <Typography tone="muted">You are all caught up.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {standaloneInvites.map((inv) => (
            <li key={`invite-${inv.id}`} className="flex items-start justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="semibold">
                  Invite to join {inv.organizationName}
                </Typography>
                <Typography variant="caption" tone="muted">
                  Organization invitation · {inv.membershipType}
                </Typography>
              </div>
              <Button
                size="sm"
                variant="primary"
                loading={actingId === inv.id}
                onClick={() => void acceptOrgInvite(inv.id)}
              >
                Accept
              </Button>
            </li>
          ))}
          {items.map((item) => {
            const isOrgInvite =
              item.sourceType === 'ORG_INVITATION' && item.actionType === 'ACCEPT_ORG_INVITATION'
            const isWorkspaceInvite =
              item.sourceType === 'WORKSPACE_INVITATION' &&
              item.actionType === 'ACCEPT_WORKSPACE_INVITATION'
            const isJoinRequest =
              item.sourceType === 'JOIN_REQUEST' && item.actionType === 'REVIEW_JOIN_REQUEST'
            const isActionable = isOrgInvite || isWorkspaceInvite || isJoinRequest
            const unread = item.status === 'ACTIVE' || item.status === 'UNREAD'
            return (
              <li key={item.id} className="flex items-start justify-between gap-md p-md">
                <div>
                  <Typography variant="small" weight={unread ? 'semibold' : 'medium'}>
                    {item.title}
                  </Typography>
                  {item.priority ? (
                    <Typography variant="caption" tone="muted">
                      {item.sourceType?.replace(/_/g, ' ') ?? 'Inbox'}
                      {item.dueAt ? ` · Due ${new Date(item.dueAt).toLocaleDateString()}` : ''}
                    </Typography>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  {isOrgInvite && item.sourceId ? (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={actingId === item.sourceId}
                      onClick={() => void acceptOrgInvite(item.sourceId, item.id)}
                    >
                      Accept
                    </Button>
                  ) : null}
                  {isWorkspaceInvite && item.sourceId ? (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={actingId === item.sourceId}
                      onClick={() => void acceptWorkspaceInvite(item.sourceId, item.id)}
                    >
                      Accept
                    </Button>
                  ) : null}
                  {isJoinRequest && item.sourceId ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        loading={actingId === item.sourceId}
                        onClick={() => void reviewJoinRequest(item.sourceId, 'approve', item.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={actingId === item.sourceId}
                        onClick={() => void reviewJoinRequest(item.sourceId, 'reject', item.id)}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {unread && !isActionable ? (
                    <Button size="sm" variant="ghost" onClick={() => void markRead(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Stack>
  )
}
