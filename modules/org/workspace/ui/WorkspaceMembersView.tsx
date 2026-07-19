'use client'

import { Ban } from 'lucide-react'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import NextLink from 'next/link'
import { Typography, Badge, Button, ConfirmDialog, PageSkeleton } from '@/shared/ui'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { ROUTES } from '@/constants/routes'
import { useWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import { FEATURES } from '@/config/features'

function isActiveMemberStatus(status: string): boolean {
  return status.toLowerCase() === 'active'
}

export function WorkspaceMembersView({ embedded = false }: { embedded?: boolean } = {}) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { profile, session } = useAuth()
  const { canManageMembers, canInviteMembers } = useWorkspaceAuthorization(workspaceId)

  const { workspace, loading: workspaceLoading, error: workspaceError } = useWorkspace(workspaceId)
  const {
    members,
    loading: membersLoading,
    error: membersError,
    deactivateMember,
  } = useWorkspaceMembers(workspaceId)

  const userIds = useMemo(() => members.map((m) => m.userId), [members])
  const { peopleById, labelFor } = useResolveUsers(userIds)

  const [confirmDeactivate, setConfirmDeactivate] = useState<{
    memberId: string
    displayName: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const currentUserId = profile?.user_id ?? session?.user?.id
  const loading = workspaceLoading || membersLoading
  const loadError = workspaceError || membersError

  const handleDeactivateMember = async () => {
    if (!confirmDeactivate) return
    setActionLoading(true)
    try {
      await deactivateMember(confirmDeactivate.memberId)
      toast.success('Member deactivated')
      setConfirmDeactivate(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.problem.detail : 'Failed to deactivate member')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <PageSkeleton variant="list" />
  }

  if (loadError) {
    return (
      <div>
        <Typography tone="error">{loadError}</Typography>
      </div>
    )
  }

  return (
    <div>
      {!embedded ? (
        <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Members" className="mb-4" />
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
              Members
            </Typography>
            <Typography as="p" variant="small" tone="muted" className="mt-1">
              People with access to this workspace.
            </Typography>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          {FEATURES.orgInvites && canInviteMembers && (
            <NextLink
              href={ROUTES.workspace.directory(workspaceId, 'invitations')}
              className="inline-flex items-center bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Invitations
            </NextLink>
          )}
        </div>
      </div>

      <div className="overflow-hidden border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">User</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Joined</th>
              {canManageMembers && (
                <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={canManageMembers ? 5 : 4}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  No members yet
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const isMemberOwner = workspace?.ownerUserId === m.userId
                const isSelf = m.userId === currentUserId
                const displayName = labelFor(m.userId, {
                  currentUserId,
                  youLabel: profile?.display_name || session?.user?.fullName || 'You',
                })

                return (
                  <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3">
                      <UserIdentity
                        userId={m.userId}
                        person={peopleById[m.userId]}
                        fallbackName={
                          isSelf
                            ? profile?.display_name || session?.user?.fullName || 'You'
                            : null
                        }
                        showEmail
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="soft" tone={isMemberOwner ? 'primary' : 'default'}>
                        {isMemberOwner ? 'owner' : 'member'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="solid"
                        tone={isActiveMemberStatus(m.status) ? 'success' : 'neutral'}
                      >
                        {m.status
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                    </td>
                    {canManageMembers && (
                      <td className="px-4 py-3">
                        {m.userId !== currentUserId &&
                          !isMemberOwner &&
                          isActiveMemberStatus(m.status) && (
                            <Button
                              variant="ghost"
                              tone="error"
                              onClick={() =>
                                setConfirmDeactivate({ memberId: m.id, displayName })
                              }
                              icon={<Ban size={16} />}
                            >
                              Deactivate
                            </Button>
                          )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {confirmDeactivate && (
        <ConfirmDialog
          open={!!confirmDeactivate}
          onClose={() => setConfirmDeactivate(null)}
          title="Deactivate member"
          message={`Deactivate ${confirmDeactivate.displayName}? They will lose access to this workspace.`}
          confirmLabel="Deactivate"
          variant="danger"
          onConfirm={handleDeactivateMember}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
