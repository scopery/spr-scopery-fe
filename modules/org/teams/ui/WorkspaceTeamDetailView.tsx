'use client'

import { Archive, Ban, Check, Plus, Save, Trash2, UserPlus } from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import NextLink from 'next/link'
import { Badge, Button, ConfirmDialog, Input, Modal, Stack, Typography, PageSkeleton } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { useOrgTeamDetail } from '../hooks/useOrgTeamDetail'
import * as orgTeamsApi from '../api/org-teams.api'
import { OrgTeamAssignmentStatus, OrgTeamStatus } from '../model'

export function WorkspaceTeamDetailView() {
  const { workspaceId, teamId } = useParams<{ workspaceId: string; teamId: string }>()
  const { workspaces } = useAuth()
  const organizationId = useMemo(
    () => workspaces.find((w) => w.id === workspaceId)?.organizationId ?? null,
    [workspaces, workspaceId]
  )
  const {
    canViewTeams,
    canUpdateTeams,
    canArchiveTeams,
    canAddTeamMembers,
    canRemoveTeamMembers,
    canManageTeams,
    loading: authzLoading,
  } = useWorkspaceAuthorization(workspaceId, organizationId)

  const { team, members, assignments, loading, error, load } = useOrgTeamDetail(
    organizationId,
    teamId
  )

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [newUserId, setNewUserId] = useState('')
  const [removeUserId, setRemoveUserId] = useState<string | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (canViewTeams && organizationId && teamId) void load()
  }, [canViewTeams, organizationId, teamId, load])

  useEffect(() => {
    if (team) {
      setEditName(team.name)
      setEditDescription(team.description ?? '')
    }
  }, [team])

  const activeAssignment = assignments.find(
    (a) => a.workspaceId === workspaceId && a.status === OrgTeamAssignmentStatus.Active
  )
  const isAssignedHere = !!activeAssignment

  const handleSave = async () => {
    if (!organizationId || !team) return
    const name = editName.trim()
    if (!name) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      await orgTeamsApi.updateOrgTeam(organizationId, team.id, {
        name,
        description: editDescription.trim() || undefined,
      })
      toast.success('Team updated')
      await load()
    } catch {
      /* interceptor */
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!organizationId || !team) return
    setActionLoading(true)
    try {
      await orgTeamsApi.archiveOrgTeam(organizationId, team.id)
      toast.success('Team archived')
      setArchiveConfirm(false)
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!organizationId || !team) return
    setActionLoading(true)
    try {
      await orgTeamsApi.activateOrgTeam(organizationId, team.id)
      toast.success('Team activated')
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!organizationId || !team) return
    const userId = newUserId.trim()
    if (!userId) {
      toast.error('User ID is required')
      return
    }
    setActionLoading(true)
    try {
      await orgTeamsApi.addOrgTeamMember(organizationId, team.id, userId)
      toast.success('Member added')
      setAddMemberOpen(false)
      setNewUserId('')
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!organizationId || !team || !removeUserId) return
    setActionLoading(true)
    try {
      await orgTeamsApi.removeOrgTeamMember(organizationId, team.id, removeUserId)
      toast.success('Member removed')
      setRemoveUserId(null)
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignHere = async () => {
    if (!organizationId || !team) return
    setActionLoading(true)
    try {
      await orgTeamsApi.assignOrgTeamToWorkspace(organizationId, team.id, workspaceId)
      toast.success('Team assigned to this workspace')
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeHere = async () => {
    if (!organizationId || !team || !activeAssignment) return
    setActionLoading(true)
    try {
      await orgTeamsApi.revokeOrgTeamWorkspaceAssignment(
        organizationId,
        team.id,
        activeAssignment.id
      )
      toast.success('Assignment revoked')
      await load()
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  if (authzLoading || loading) {
    return (
      <PageSkeleton variant="detail" />
    )
  }

  if (!canViewTeams) {
    return (
      <div>
        <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Team" className="mb-4" />
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            You do not have permission to view this team.
          </Typography>
        </div>
      </div>
    )
  }

  if (error || !team || !organizationId) {
    return (
      <div>
        <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Team" className="mb-4" />
        <Typography tone="error">{error || 'Team not found'}</Typography>
        <NextLink href={ROUTES.workspace.teams(workspaceId)} className="mt-4 inline-block text-primary">
          Back to teams
        </NextLink>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        current={team.name}
        className="mb-4"
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Typography as="h1" size="lg" weight="semibold">
              {team.name}
            </Typography>
            <Badge variant="solid"
              tone={team.status === OrgTeamStatus.Active ? 'success' : 'neutral'}
            >
                      {team.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          </div>
          <Typography as="p" variant="small" tone="muted" className="font-mono">
            {team.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          {team.status === OrgTeamStatus.Active && canArchiveTeams && (
            <Button variant="secondary" onClick={() => setArchiveConfirm(true)} icon={<Archive size={16} />}>
              Archive
            </Button>
          )}
          {team.status === OrgTeamStatus.Archived && canArchiveTeams && (
            <Button
              variant="secondary"
              loading={actionLoading}
              onClick={() => void handleActivate()} icon={<Check size={16} />}>
              Activate
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8 border border-neutral-200 bg-white p-6">
        <Typography as="h2" size="lg" weight="bold" className="mb-4">
          Details
        </Typography>
        {canUpdateTeams && team.status === OrgTeamStatus.Active ? (
          <Stack direction="vertical" spacing="md" className="max-w-md">
            <Input
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
            />
            <Input
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              fullWidth
            />
            <Button variant="primary" loading={saving} onClick={() => void handleSave()} icon={<Save size={16} />}>
              Save changes
            </Button>
          </Stack>
        ) : (
          <Typography variant="small" tone="muted">
            {team.description || 'No description'}
          </Typography>
        )}
      </div>

      <div className="mb-8 border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Typography as="h2" size="lg" weight="bold">
            This workspace
          </Typography>
          {canManageTeams && team.status === OrgTeamStatus.Active && (
            isAssignedHere ? (
              <Button
                variant="secondary"
                loading={actionLoading}
                onClick={() => void handleRevokeHere()} icon={<Ban size={16} />}>
                Revoke assignment
              </Button>
            ) : (
              <Button
                variant="primary"
                loading={actionLoading}
                onClick={() => void handleAssignHere()} icon={<UserPlus size={16} />}>
                Assign to this workspace
              </Button>
            )
          )}
        </div>
        <Typography variant="small" tone="muted">
          {isAssignedHere
            ? 'This team is assigned to the current workspace.'
            : 'This team is not assigned to the current workspace yet.'}
        </Typography>
        {assignments.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm text-neutral-700">
            {assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-2">
                <span className="font-mono text-xs">{a.workspaceId.slice(0, 8)}…</span>
                <Badge variant="solid"
                  tone={a.status === OrgTeamAssignmentStatus.Active ? 'success' : 'neutral'}
                >
                      {String(a.status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
                {a.workspaceId === workspaceId && (
                  <Badge variant="outline">
                    current
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Typography as="h2" size="lg" weight="bold">
            Members
          </Typography>
          {canAddTeamMembers && team.status === OrgTeamStatus.Active && (
            <Button variant="primary" onClick={() => setAddMemberOpen(true)} icon={<Plus size={16} />}>
              Add member
            </Button>
          )}
        </div>
        <div className="overflow-hidden border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">User ID</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Joined</th>
                <th className="min-w-[10rem] whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                    No members
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.userId} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{m.userId}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(m.joinedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {canRemoveTeamMembers && (
                        <Button
                          variant="ghost"
                          tone="error"
                          onClick={() => setRemoveUserId(m.userId)} icon={<Trash2 size={16} />}>
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={addMemberOpen}
        onClose={() => {
          setAddMemberOpen(false)
          setNewUserId('')
        }}
        title="Add team member"
        size="sm"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setAddMemberOpen(false)
              setNewUserId('')
            },
            variant: 'ghost',
          },
          {
            label: 'Add',
            onClick: () => void handleAddMember(),
            variant: 'primary',
            loading: actionLoading,
          },
        ]}
      >
        <Input
          label="User ID"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          fullWidth
          placeholder="UUID of the user"
        />
      </Modal>

      <ConfirmDialog
        open={!!removeUserId}
        onClose={() => setRemoveUserId(null)}
        title="Remove team member?"
        message="This user will lose team membership. Workspace access via this team may be affected."
        confirmLabel="Remove"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleRemoveMember}
      />

      <ConfirmDialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        title="Archive team?"
        message="Archived teams cannot be assigned until activated again."
        confirmLabel="Archive"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleArchive}
      />
    </div>
  )
}
