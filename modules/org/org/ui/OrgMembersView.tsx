'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, LogOut } from 'lucide-react'
import { Typography, Badge, Button, ContentLoader, Select, ConfirmDialog } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { orgInvitesApi } from '@/modules/org'
import { useOrg, useOrgMembers, useOrgInvites } from '@/modules/org'
import { useAuth } from '@/modules/auth'
import { isOrgReadonly } from '@/utils/permissions'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'
import { CreateInviteModal } from '@/modules/org'
import { FEATURES } from '@/config/features'

type Tab = 'members' | 'invites'

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'member', label: 'Member' },
  { value: 'partner', label: 'Partner' },
]

export function OrgMembersView() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const { profile } = useAuth()

  const { org, loading: orgLoading } = useOrg(orgId)
  const {
    members,
    loading: membersLoading,
    patchMember,
    removeMember,
    leave,
  } = useOrgMembers(orgId)
  const { invites, loadInvites } = useOrgInvites(orgId)
  const [tab, setTab] = useState<Tab>('members')
  const [createInviteOpen, setCreateInviteOpen] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{
    userId: string
    displayName: string
  } | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<{ inviteId: string; email: string } | null>(
    null
  )
  const [actionLoading, setActionLoading] = useState(false)

  const loading = orgLoading || membersLoading
  const isOwner = org?.my_role === 'owner'
  const isPartner = org ? isOrgReadonly(org.my_role) : false
  const currentUserId = profile?.user_id

  useEffect(() => {
    if (tab === 'invites' && isOwner) void loadInvites()
  }, [tab, isOwner, loadInvites])

  const handleLeaveOrg = async () => {
    setActionLoading(true)
    try {
      await leave()
      toast.success('Left organization')
      router.replace(ROUTES.org.projects(orgId))
    } catch (err) {
      if (err instanceof ApiError && getProblemCode(err) === 'LAST_OWNER') {
        toast.error('Cannot leave: you are the last owner. Transfer ownership or remove the org.')
      } else {
        toast.error(err instanceof ApiError ? err.problem.detail : 'Failed to leave')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, role: 'owner' | 'member' | 'partner') => {
    if (isPartner) return
    setActionLoading(true)
    try {
      await patchMember(userId, { role })
      toast.success('Role updated')
    } catch (err) {
      if (err instanceof ApiError && getProblemCode(err) === 'LAST_OWNER') {
        toast.error('Cannot change: last owner must transfer ownership first.')
      } else {
        toast.error(err instanceof ApiError ? err.problem.detail : 'Failed to update role')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!confirmRemove || isPartner) return
    setActionLoading(true)
    try {
      await removeMember(confirmRemove.userId)
      toast.success('Member removed')
      setConfirmRemove(null)
    } catch (err) {
      if (err instanceof ApiError && getProblemCode(err) === 'LAST_OWNER') {
        toast.error('Cannot remove the last owner.')
      } else {
        toast.error(err instanceof ApiError ? err.problem.detail : 'Failed to remove')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeInvite = async () => {
    if (!confirmRevoke || isPartner) return
    setActionLoading(true)
    try {
      await orgInvitesApi.revokeInvite(orgId, confirmRevoke.inviteId)
      toast.success('Invite revoked')
      loadInvites()
    } catch {
      toast.error('Failed to revoke invite')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (!org) {
    return (
      <div>
        <Typography tone="error">Organization not found</Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Typography as="h1" size="xl" weight="bold">
          Members
        </Typography>
        {!isPartner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(ROUTES.org.projects(orgId))}
            className="text-neutral-600"
          >
            Back to projects
          </Button>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setTab('members')}
          className={cn(
            '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
            tab === 'members'
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          )}
        >
          Members
        </button>
        {FEATURES.orgInvites && isOwner && (
          <button
            type="button"
            onClick={() => setTab('invites')}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
              tab === 'invites'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            Invites
          </button>
        )}
      </div>

      {tab === 'members' && (
        <>
          <div className="mb-6 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-500">
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Name</th>
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Email</th>
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Role</th>
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Status</th>
                  {isOwner && (
                    <th className="w-48 px-4 py-3 text-left font-normal text-neutral-700">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id} className="border-b border-neutral-200 last:border-0">
                    <td className="px-4 py-3">{m.display_name}</td>
                    <td className="px-4 py-3 text-neutral-600">{m.email}</td>
                    <td className="px-4 py-3">
                      {isOwner && m.user_id !== currentUserId ? (
                        <Select
                          options={ROLE_OPTIONS}
                          value={m.role}
                          onValueChange={(v: string) =>
                            handleChangeRole(m.user_id, v as 'owner' | 'member' | 'partner')
                          }
                          size="sm"
                          className="min-w-[100px]"
                        />
                      ) : (
                        <Badge variant="soft" tone="default" size="sm">
                          {m.role}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="solid"
                        tone={m.status === 'active' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        {m.user_id !== currentUserId && m.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            tone="error"
                            onClick={() =>
                              setConfirmRemove({ userId: m.user_id, displayName: m.display_name })
                            }
                            disabled={isPartner}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmLeave(true)}
              disabled={isPartner}
            >
              <LogOut size={12} />
              Leave organization
            </Button>
          </div>
        </>
      )}

      {FEATURES.orgInvites && tab === 'invites' && isOwner && (
        <>
          <div className="mb-4 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setCreateInviteOpen(true)}>
              <Plus size={16} />
              Create invite
            </Button>
          </div>
          <div className=" overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-500">
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Email</th>
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Role</th>
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Status</th>
                  <th className="px-4 py-3 text-left font-normal text-neutral-700">Expires</th>
                  <th className="w-24 px-4 py-3 text-left font-normal text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      No pending invites
                    </td>
                  </tr>
                ) : (
                  invites.map((inv) => (
                    <tr key={inv.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3">{inv.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="soft" size="sm">
                          {inv.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{inv.status}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {inv.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            tone="error"
                            onClick={() => setConfirmRevoke({ inviteId: inv.id, email: inv.email })}
                          >
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
        </>
      )}

      {FEATURES.orgInvites && (
        <CreateInviteModal
          orgId={orgId}
          open={createInviteOpen}
          onClose={() => setCreateInviteOpen(false)}
          onSuccess={loadInvites}
        />
      )}

      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave organization"
        message="Are you sure you want to leave this organization? You will lose access to all projects."
        confirmLabel="Leave"
        variant="danger"
        onConfirm={handleLeaveOrg}
        loading={actionLoading}
      />

      {confirmRemove && (
        <ConfirmDialog
          open={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          title="Remove member"
          message={`Remove ${confirmRemove.displayName} from this organization?`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={handleRemoveMember}
          loading={actionLoading}
        />
      )}

      {confirmRevoke && (
        <ConfirmDialog
          open={!!confirmRevoke}
          onClose={() => setConfirmRevoke(null)}
          title="Revoke invite"
          message={`Revoke the invite for ${confirmRevoke.email}?`}
          confirmLabel="Revoke"
          variant="danger"
          onConfirm={handleRevokeInvite}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
