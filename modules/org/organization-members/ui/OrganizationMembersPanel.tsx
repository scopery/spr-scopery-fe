'use client'

import { Ban, Check, Eye, Plus, UserMinus } from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Modal,
  Stack,
  Typography,
  Skeleton,
  Select,
} from '@/shared/ui'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { UserSearchSelect } from '@/modules/platform/identity/presentation/ui/UserSearchSelect'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { toast } from 'sonner'
import { useOrganizationMembers } from '../hooks/useOrganizationMembers'
import * as organizationMembersApi from '../api/organization-members.api'
import { OrgMemberStatus } from '../model/organization-member'
import type { OrganizationMember, OrgMemberAccessResponse } from '../model/organization-member'
import { MemberProjectAccessEditor } from '@/modules/org/workspace'

function statusTone(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case OrgMemberStatus.Active:
      return 'success'
    case OrgMemberStatus.Suspended:
      return 'warning'
    case OrgMemberStatus.Removed:
      return 'error'
    default:
      return 'neutral'
  }
}

interface OrganizationMembersPanelProps {
  organizationId: string
  /** Compact header when embedded in admin tabs */
  embedded?: boolean
}

export function OrganizationMembersPanel({
  organizationId,
  embedded = false,
}: OrganizationMembersPanelProps) {
  const { items, loading, error, statusFilter, setStatusFilter, load } =
    useOrganizationMembers(organizationId)
  const userIds = useMemo(() => items.map((m) => m.userId), [items])
  const { peopleById, labelFor } = useResolveUsers(userIds)
  const [addOpen, setAddOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm] = useState<{
    type: 'suspend' | 'activate' | 'kick'
    member: OrganizationMember
  } | null>(null)
  const [accessFor, setAccessFor] = useState<OrganizationMember | null>(null)
  const [access, setAccess] = useState<OrgMemberAccessResponse | null>(null)
  const [accessLoading, setAccessLoading] = useState(false)

  useEffect(() => {
    void load()
  }, [load])

  const openAccess = async (member: OrganizationMember) => {
    setAccessFor(member)
    setAccess(null)
    setAccessLoading(true)
    try {
      const res = await organizationMembersApi.getOrganizationMemberAccess(
        organizationId,
        member.userId
      )
      setAccess(res)
    } catch {
      setAccessFor(null)
    } finally {
      setAccessLoading(false)
    }
  }

  const handleAdd = async () => {
    const id = userId.trim()
    if (!id) {
      toast.error('Select a user')
      return
    }
    setActionLoading(true)
    try {
      await organizationMembersApi.addOrganizationMember(organizationId, {
        userId: id,
        membershipType: 'MEMBER',
      })
      toast.success('Member added')
      setAddOpen(false)
      setUserId('')
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirm) return
    setActionLoading(true)
    try {
      if (confirm.type === 'suspend') {
        await organizationMembersApi.suspendOrganizationMember(organizationId, confirm.member.id)
        toast.success('Member suspended')
      } else if (confirm.type === 'activate') {
        await organizationMembersApi.activateOrganizationMember(organizationId, confirm.member.id)
        toast.success('Member activated')
      } else {
        await organizationMembersApi.removeOrganizationMember(organizationId, confirm.member.id)
        toast.success('Member kicked — they can be invited again later')
      }
      setConfirm(null)
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      {!embedded && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Typography as="h1" size="md" weight="medium">
              Organization members
            </Typography>
            <Typography as="p" variant="small" tone="muted" className="mt-1">
              People who belong to this organization.
            </Typography>
          </div>
          <Button variant="primary" onClick={() => setAddOpen(true)} icon={<Plus size={16} />}>
            Add member
          </Button>
        </div>
      )}
      {embedded && (
        <div className="mb-4 flex justify-end">
          <Button variant="primary" onClick={() => setAddOpen(true)} icon={<Plus size={16} />}>
            Add member
          </Button>
        </div>
      )}

      <div className="mb-4 w-44">
        <Select
          value={statusFilter ?? ''}
          onValueChange={(v: string) => setStatusFilter(v || undefined)}
          options={[
            { value: '', label: 'All statuses' },
            { value: OrgMemberStatus.Active, label: 'Active' },
            { value: OrgMemberStatus.Suspended, label: 'Suspended' },
            { value: OrgMemberStatus.Removed, label: 'Kicked' },
          ]}
          placeholder="All statuses"
        />
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
            ariaLabel="Organization members"
            rows={items}
            rowKey={(member) => member.id}
            emptyMessage="No members"
            columns={[
              {
                id: 'user',
                header: 'User',
                kind: 'reference',
                cell: (member) =>
                  peopleById[member.userId] ? (
                    <UserIdentity
                      userId={member.userId}
                      person={peopleById[member.userId]}
                      showEmail
                      size="sm"
                    />
                  ) : (
                    '—'
                  ),
              },
              { id: 'type', header: 'Type', accessor: 'membershipType' },
              {
                id: 'status',
                header: 'Status',
                cell: (member) => (
                  <Badge variant="solid" tone={statusTone(member.status)}>
                    {member.status === OrgMemberStatus.Removed
                      ? 'Kicked'
                      : String(member.status)
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                ),
              },
              {
                id: 'joined',
                header: 'Joined',
                accessor: (member) => new Date(member.joinedAt).toLocaleDateString(),
              },
              {
                id: 'actions',
                header: 'Actions',
                width: '16rem',
                cell: (member) => (
                  <div className="flex flex-nowrap items-center gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => void openAccess(member)}
                      icon={<Eye size={16} />}
                    >
                      Access
                    </Button>
                    {member.status === OrgMemberStatus.Active &&
                    member.membershipType !== 'OWNER' ? (
                      <Button
                        variant="ghost"
                        onClick={() => setConfirm({ type: 'suspend', member })}
                        icon={<Ban size={16} />}
                      >
                        Suspend
                      </Button>
                    ) : null}
                    {member.status === OrgMemberStatus.Suspended ? (
                      <Button
                        variant="ghost"
                        onClick={() => setConfirm({ type: 'activate', member })}
                        icon={<Check size={16} />}
                      >
                        Activate
                      </Button>
                    ) : null}
                    {member.status === OrgMemberStatus.Removed ? (
                      <Button
                        variant="ghost"
                        onClick={() => setConfirm({ type: 'activate', member })}
                        icon={<Check size={16} />}
                      >
                        Reinstate
                      </Button>
                    ) : null}
                    {member.membershipType !== 'OWNER' &&
                    member.status === OrgMemberStatus.Active ? (
                      <Button
                        variant="ghost"
                        tone="error"
                        onClick={() => setConfirm({ type: 'kick', member })}
                        icon={<UserMinus size={16} />}
                      >
                        Kick
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          setUserId('')
        }}
        title="Add organization member"
        size="sm"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setAddOpen(false)
              setUserId('')
            },
            variant: 'ghost',
          },
          {
            label: 'Add',
            onClick: () => void handleAdd(),
            variant: 'primary',
            loading: actionLoading,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <UserSearchSelect
            value={userId}
            onChange={(id) => setUserId(id)}
            placeholder="Search by name or email…"
          />
        </Stack>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.type === 'kick'
            ? 'Kick member?'
            : confirm?.type === 'suspend'
              ? 'Suspend member?'
              : 'Activate member?'
        }
        message={
          confirm
            ? confirm.type === 'kick'
              ? `Kick ${labelFor(confirm.member.userId)} from this organization? They lose access now but can be invited again later.`
              : confirm.type === 'suspend'
                ? `Suspend ${labelFor(confirm.member.userId)}?`
                : `Activate ${labelFor(confirm.member.userId)}?`
            : ''
        }
        confirmLabel={
          confirm?.type === 'kick' ? 'Kick' : confirm?.type === 'suspend' ? 'Suspend' : 'Activate'
        }
        variant={confirm?.type === 'activate' ? 'default' : 'danger'}
        loading={actionLoading}
        onConfirm={handleConfirm}
      />

      <Modal
        open={!!accessFor}
        onClose={() => {
          setAccessFor(null)
          setAccess(null)
        }}
        title={accessFor ? `Access · ${labelFor(accessFor.userId)}` : 'Access'}
        size="md"
      >
        {accessLoading ? (
          <Skeleton variant="rectangular" width="100%" height={120} />
        ) : !access || access.workspaces.length === 0 ? (
          <Typography variant="small" tone="muted">
            No workspace memberships in this organization.
          </Typography>
        ) : (
          <Stack direction="vertical" spacing="md">
            {access.workspaces.map((ws) => (
              <Card key={ws.workspaceId} className="p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Typography size="sm" weight="semibold">
                    {ws.workspaceName}
                  </Typography>
                  <Badge
                    variant="soft"
                    tone={ws.membershipStatus === 'ACTIVE' ? 'success' : 'neutral'}
                  >
                    {ws.membershipStatus}
                  </Badge>
                </div>
                {accessFor ? (
                  <MemberProjectAccessEditor
                    workspaceId={ws.workspaceId}
                    userId={accessFor.userId}
                    compact
                    initial={{
                      accessMode: ws.accessMode,
                      totalProjects: ws.totalProjects,
                      projects: ws.projects,
                      availableProjects: ws.availableProjects ?? [],
                    }}
                    onSaved={(next) => {
                      setAccess((prev) => {
                        if (!prev) return prev
                        return {
                          ...prev,
                          workspaces: prev.workspaces.map((row) =>
                            row.workspaceId === next.workspaceId
                              ? {
                                  ...row,
                                  accessMode: next.accessMode,
                                  totalProjects: next.totalProjects,
                                  projects: next.projects,
                                  availableProjects: next.availableProjects,
                                }
                              : row
                          ),
                        }
                      })
                    }}
                  />
                ) : null}
              </Card>
            ))}
          </Stack>
        )}
      </Modal>
    </div>
  )
}
