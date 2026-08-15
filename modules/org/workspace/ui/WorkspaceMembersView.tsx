'use client'

import { Ban, Eye, Plus } from 'lucide-react'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import NextLink from 'next/link'
import {
  Typography,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Modal,
  PageSkeleton,
  Skeleton,
} from '@/shared/ui'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { ROUTES } from '@/constants/routes'
import { useWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers'
import * as workspaceMembersApi from '../api/workspace-members.api'
import type { WorkspaceMemberAccessResponse } from '../api/workspace-members.api'
import { MemberProjectAccessEditor } from './MemberProjectAccessEditor'
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
  const [accessUserId, setAccessUserId] = useState<string | null>(null)
  const [accessName, setAccessName] = useState('')
  const [access, setAccess] = useState<WorkspaceMemberAccessResponse | null>(null)
  const [accessLoading, setAccessLoading] = useState(false)

  const currentUserId = profile?.user_id ?? session?.user?.id
  const loading = workspaceLoading || membersLoading
  const loadError = workspaceError || membersError

  const openAccess = async (userId: string, displayName: string) => {
    setAccessUserId(userId)
    setAccessName(displayName)
    setAccess(null)
    setAccessLoading(true)
    try {
      const res = await workspaceMembersApi.getWorkspaceMemberAccess(workspaceId, userId)
      setAccess(res)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.problem.detail : 'Failed to load access')
      setAccessUserId(null)
    } finally {
      setAccessLoading(false)
    }
  }

  const handleDeactivateMember = async () => {
    if (!confirmDeactivate) return
    setActionLoading(true)
    try {
      await deactivateMember(confirmDeactivate.memberId)
      toast.success('Member kicked — they can be invited again later')
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
        <WorkspaceHierarchyBreadcrumb
          workspaceId={workspaceId}
          current="Members"
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
              className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-sm font-normal text-white hover:opacity-90"
            >
              <Plus size={16} aria-hidden />
              Invite
            </NextLink>
          )}
        </div>
      </div>

      <div className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Workspace members"
          rows={members}
          rowKey={(member) => member.id}
          emptyMessage="No members yet"
          columns={[
            {
              id: 'user',
              header: 'User',
              kind: 'reference',
              cell: (member) => {
                const isSelf = member.userId === currentUserId
                return peopleById[member.userId] || isSelf ? (
                  <UserIdentity
                    userId={member.userId}
                    person={peopleById[member.userId]}
                    fallbackName={
                      isSelf ? profile?.display_name || session?.user?.fullName || 'You' : null
                    }
                    showEmail
                    size="sm"
                  />
                ) : (
                  '—'
                )
              },
            },
            {
              id: 'role',
              header: 'Role',
              cell: (member) => {
                const owner = workspace?.ownerUserId === member.userId
                return (
                  <Badge variant="soft" tone={owner ? 'primary' : 'default'}>
                    {owner ? 'owner' : 'member'}
                  </Badge>
                )
              },
            },
            {
              id: 'status',
              header: 'Status',
              cell: (member) => (
                <Badge
                  variant="solid"
                  tone={isActiveMemberStatus(member.status) ? 'success' : 'neutral'}
                >
                  {member.status
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              ),
            },
            {
              id: 'joined',
              header: 'Joined',
              accessor: (member) =>
                member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—',
            },
            ...(canManageMembers
              ? [
                  {
                    id: 'actions',
                    header: 'Actions',
                    width: '12rem',
                    cell: (member: (typeof members)[number]) => {
                      const owner = workspace?.ownerUserId === member.userId
                      const displayName = labelFor(member.userId, {
                        currentUserId,
                        youLabel: profile?.display_name || session?.user?.fullName || 'You',
                      })
                      return (
                        <div className="flex flex-nowrap items-center gap-1">
                          <Button
                            variant="ghost"
                            onClick={() => void openAccess(member.userId, displayName)}
                            icon={<Eye size={16} />}
                          >
                            Access
                          </Button>
                          {member.userId !== currentUserId &&
                          !owner &&
                          isActiveMemberStatus(member.status) ? (
                            <Button
                              variant="ghost"
                              tone="error"
                              onClick={() =>
                                setConfirmDeactivate({ memberId: member.id, displayName })
                              }
                              icon={<Ban size={16} />}
                            >
                              Kick
                            </Button>
                          ) : null}
                        </div>
                      )
                    },
                  },
                ]
              : []),
          ]}
        />
      </div>

      {confirmDeactivate && (
        <ConfirmDialog
          open={!!confirmDeactivate}
          onClose={() => setConfirmDeactivate(null)}
          title="Kick member?"
          message={`Kick ${confirmDeactivate.displayName} from this workspace? They lose access now but can be invited again later.`}
          confirmLabel="Kick"
          variant="danger"
          onConfirm={handleDeactivateMember}
          loading={actionLoading}
        />
      )}

      <Modal
        open={!!accessUserId}
        onClose={() => {
          setAccessUserId(null)
          setAccess(null)
        }}
        title={`Access · ${accessName}`}
        size="md"
      >
        {accessLoading ? (
          <Skeleton variant="rectangular" width="100%" height={100} />
        ) : !access || !accessUserId ? (
          <Typography variant="small" tone="muted">
            Could not load project access for this member.
          </Typography>
        ) : (
          <MemberProjectAccessEditor
            workspaceId={workspaceId}
            userId={accessUserId}
            initial={access}
            onSaved={setAccess}
          />
        )}
      </Modal>
    </div>
  )
}
