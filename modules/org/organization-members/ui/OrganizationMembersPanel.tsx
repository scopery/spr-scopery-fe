'use client'

import { Ban, Check, Eye, Plus, UserMinus } from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, ConfirmDialog, Modal, Stack, Typography, Skeleton, Select } from '@/shared/ui'
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Typography as="h1" size="lg" weight="semibold">
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

      <div className="overflow-hidden border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">User</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Joined</th>
              <th className="min-w-[16rem] whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Skeleton variant="rectangular" width="100%" height={80} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No members
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <UserIdentity userId={m.userId} person={peopleById[m.userId]} showEmail size="sm" />
                  </td>
                  <td className="px-4 py-3">{m.membershipType}</td>
                  <td className="px-4 py-3">
                    <Badge variant="solid" tone={statusTone(m.status)}>
                      {m.status === OrgMemberStatus.Removed
                        ? 'Kicked'
                        : String(m.status)
                            .replace(/_/g, ' ')
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-nowrap items-center gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => void openAccess(m)}
                        icon={<Eye size={16} />}
                      >
                        Access
                      </Button>
                      {m.status === OrgMemberStatus.Active && m.membershipType !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          onClick={() => setConfirm({ type: 'suspend', member: m })} icon={<Ban size={16} />}>
                          Suspend
                        </Button>
                      )}
                      {m.status === OrgMemberStatus.Suspended && (
                        <Button
                          variant="ghost"
                          onClick={() => setConfirm({ type: 'activate', member: m })} icon={<Check size={16} />}>
                          Activate
                        </Button>
                      )}
                      {m.status === OrgMemberStatus.Removed && (
                        <Button
                          variant="ghost"
                          onClick={() => setConfirm({ type: 'activate', member: m })} icon={<Check size={16} />}>
                          Reinstate
                        </Button>
                      )}
                      {m.membershipType !== 'OWNER' && m.status === OrgMemberStatus.Active && (
                        <Button
                          variant="ghost"
                          tone="error"
                          onClick={() => setConfirm({ type: 'kick', member: m })} icon={<UserMinus size={16} />}>
                          Kick
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
            label="User"
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
              <div key={ws.workspaceId} className="border border-neutral-200 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Typography size="sm" weight="semibold">
                    {ws.workspaceName}
                  </Typography>
                  <Badge variant="soft" tone={ws.membershipStatus === 'ACTIVE' ? 'success' : 'neutral'}>
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
              </div>
            ))}
          </Stack>
        )}
      </Modal>
    </div>
  )
}
