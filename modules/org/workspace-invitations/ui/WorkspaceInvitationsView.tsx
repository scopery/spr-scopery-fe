'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Ban, Plus } from 'lucide-react'
import {
  Typography,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  PageSkeleton,
  Skeleton,
} from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { CreateWorkspaceInvitationModal } from './CreateWorkspaceInvitationModal'
import { useWorkspaceInvitations } from '../hooks/useWorkspaceInvitations'
import * as workspaceInvitationsApi from '../api/workspace-invitations.api'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { FEATURES } from '@/config/features'
import { toast } from 'sonner'
import type { WorkspaceInvitation } from '../model'

function invitationDisplayStatus(inv: WorkspaceInvitation): {
  label: string
  tone: 'warning' | 'success' | 'neutral'
  isOpen: boolean
} {
  const exhausted =
    inv.status === 'ACCEPTED' ||
    (inv.maxUses != null && inv.usedCount >= inv.maxUses) ||
    // Legacy creates omitted maxUses; email invites still look "used" after accept
    (Boolean(inv.invitedEmail) && inv.usedCount > 0 && inv.status === 'PENDING')

  if (exhausted) {
    return { label: 'Accepted', tone: 'success', isOpen: false }
  }
  if (inv.status === 'PENDING') {
    return { label: 'Pending', tone: 'warning', isOpen: true }
  }
  return {
    label: inv.status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    tone: 'neutral',
    isOpen: false,
  }
}

export function WorkspaceInvitationsView({ embedded = false }: { embedded?: boolean } = {}) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { canInviteMembers, loading: authzLoading } = useWorkspaceAuthorization(workspaceId)
  const { invitations, loading, error, loadInvitations } = useWorkspaceInvitations(workspaceId)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<{ inviteId: string; email: string } | null>(
    null
  )
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (canInviteMembers) void loadInvitations()
  }, [canInviteMembers, loadInvitations])

  const handleRevoke = async () => {
    if (!confirmRevoke) return
    setActionLoading(true)
    try {
      await workspaceInvitationsApi.revokeWorkspaceInvitation(workspaceId, confirmRevoke.inviteId)
      toast.success('Invitation revoked')
      setConfirmRevoke(null)
      await loadInvitations()
    } catch {
      toast.error('Failed to revoke invite')
    } finally {
      setActionLoading(false)
    }
  }

  if (authzLoading) {
    return <PageSkeleton variant="list" />
  }

  if (!FEATURES.orgInvites || !canInviteMembers) {
    return (
      <div>
        {!embedded ? (
          <WorkspaceHierarchyBreadcrumb
            workspaceId={workspaceId}
            current="Invitations"
            className="mb-4"
          />
        ) : null}
        <Card className="bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            You do not have permission to manage workspace invitations.
          </Typography>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {!embedded ? (
        <WorkspaceHierarchyBreadcrumb
          workspaceId={workspaceId}
          current="Invitations"
          className="mb-4"
        />
      ) : null}
      <div
        className={
          embedded
            ? 'mb-4 flex flex-wrap items-center justify-end gap-2'
            : 'mb-2 flex flex-wrap items-center justify-between gap-2'
        }
      >
        {!embedded ? (
          <div>
            <Typography as="h1" size="md" weight="medium">
              Invitations
            </Typography>
            <Typography as="p" variant="small" tone="muted" className="mt-1">
              Create and revoke workspace invitation codes.
            </Typography>
          </div>
        ) : null}
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          Invite
        </Button>
      </div>

      {error && (
        <Typography tone="error" className="mb-4">
          {error}
        </Typography>
      )}

      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-4">
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        ) : (
          <DataTable
            ariaLabel="Workspace invitations"
            rows={invitations}
            rowKey={(invitation) => invitation.id}
            emptyMessage="No invitations yet"
            columns={[
              {
                id: 'email',
                header: 'Email',
                accessor: (invitation) => invitation.invitedEmail ?? '—',
              },
              {
                id: 'code',
                header: 'Code hint',
                kind: 'code',
                accessor: (invitation) =>
                  invitation.invitationCodeHint ? `••••${invitation.invitationCodeHint}` : '—',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (invitation) => {
                  const display = invitationDisplayStatus(invitation)
                  return (
                    <Badge variant="solid" tone={display.tone}>
                      {display.label}
                    </Badge>
                  )
                },
              },
              {
                id: 'uses',
                header: 'Uses',
                accessor: (invitation) =>
                  `${invitation.usedCount}${invitation.maxUses != null ? ` / ${invitation.maxUses}` : ''}`,
              },
              {
                id: 'expires',
                header: 'Expires',
                accessor: (invitation) =>
                  invitation.expiresAt
                    ? new Date(invitation.expiresAt).toLocaleDateString()
                    : 'No expiry',
              },
              {
                id: 'actions',
                header: 'Actions',
                width: '10rem',
                cell: (invitation) => {
                  const display = invitationDisplayStatus(invitation)
                  return display.isOpen ? (
                    <Button
                      variant="ghost"
                      tone="error"
                      onClick={() =>
                        setConfirmRevoke({
                          inviteId: invitation.id,
                          email:
                            invitation.invitedEmail ??
                            invitation.invitationCodeHint ??
                            'this invite',
                        })
                      }
                      icon={<Ban size={16} />}
                    >
                      Revoke
                    </Button>
                  ) : (
                    '—'
                  )
                },
              },
            ]}
          />
        )}
      </div>

      <CreateWorkspaceInvitationModal
        workspaceId={workspaceId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadInvitations}
      />

      {confirmRevoke && (
        <ConfirmDialog
          open={!!confirmRevoke}
          onClose={() => setConfirmRevoke(null)}
          title="Revoke invitation"
          message={`Revoke the invitation for ${confirmRevoke.email}?`}
          confirmLabel="Revoke"
          variant="danger"
          onConfirm={handleRevoke}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
