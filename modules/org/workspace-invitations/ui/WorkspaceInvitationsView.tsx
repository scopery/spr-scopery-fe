'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Ban, Plus } from 'lucide-react'
import { Typography, Badge, Button, ConfirmDialog, PageSkeleton, Skeleton } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { CreateWorkspaceInvitationModal } from './CreateWorkspaceInvitationModal'
import { useWorkspaceInvitations } from '../hooks/useWorkspaceInvitations'
import * as workspaceInvitationsApi from '../api/workspace-invitations.api'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { FEATURES } from '@/config/features'
import { toast } from 'sonner'

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
    return (
      <PageSkeleton variant="list" />
    )
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
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            You do not have permission to manage workspace invitations.
          </Typography>
        </div>
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
            : 'mb-6 flex flex-wrap items-center justify-between gap-4'
        }
      >
        {!embedded ? (
          <div>
            <Typography as="h1" size="lg" weight="semibold">
              Invitations
            </Typography>
            <Typography as="p" variant="small" tone="muted" className="mt-1">
              Create and revoke workspace invitation codes.
            </Typography>
          </div>
        ) : null}
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Create invitation
        </Button>
      </div>

      {error && (
        <Typography tone="error" className="mb-4">
          {error}
        </Typography>
      )}

      <div className="overflow-hidden border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Code hint</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Uses</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Expires</th>
              <th className="min-w-[10rem] whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Skeleton variant="rectangular" width="100%" height={80} />
                </td>
              </tr>
            ) : invitations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No invitations yet
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">{inv.invitedEmail ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-neutral-600">
                    {inv.invitationCodeHint ? `••••${inv.invitationCodeHint}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="solid"
                      tone={
                        inv.status === 'PENDING'
                          ? 'warning'
                          : inv.status === 'ACCEPTED'
                            ? 'success'
                            : 'neutral'
                      }
                    >
                      {inv.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {inv.usedCount}
                    {inv.maxUses != null ? ` / ${inv.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === 'PENDING' && (
                      <Button
                        variant="ghost"
                        tone="error"
                        onClick={() =>
                          setConfirmRevoke({
                            inviteId: inv.id,
                            email: inv.invitedEmail ?? inv.invitationCodeHint ?? 'this invite',
                          })
                        } icon={<Ban size={16} />}>
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
