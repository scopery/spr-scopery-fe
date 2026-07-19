'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import NextLink from 'next/link'
import { ArrowLeft, Ban, Check, UserPlus } from 'lucide-react'
import { Typography, Button, Badge, Stack, Input, Select, PageSkeleton } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'
import { IamEntityIdentityCard } from './IamEntityIdentityCard'

const ASSIGNEE_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminWorkspaceAccessView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { assignments, roles, loading, error, actingId, creating, createAssignment, runAction } =
    useWorkspaceAccess(workspaceId)
  const { usersById, rolesById, workspacesById } = useIamIdentityDirectory({
    userIds: assignments.filter((item) => item.assigneeType === 'USER').map((item) => item.assigneeId),
    roleIds: [...assignments.map((item) => item.roleId), ...roles.map((role) => role.id)],
    workspaceIds: [workspaceId],
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ assigneeType: 'USER', assigneeId: '', roleId: '' })

  const handleCreate = async () => {
    if (!form.assigneeId.trim() || !form.roleId.trim()) return
    try {
      await createAssignment({
        assigneeType: form.assigneeType,
        assigneeId: form.assigneeId.trim(),
        roleId: form.roleId.trim(),
        workspaceId,
      })
      setCreateOpen(false)
      setForm({ assigneeType: 'USER', assigneeId: '', roleId: '' })
    } catch {
      // error already toasted
    }
  }

  const roleOptions = [
    { value: '', label: 'Enter role ID manually…' },
    ...roles.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` })),
  ]

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamUsers}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to IAM
      </NextLink>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Workspace Access
          </Typography>
          <div className="mt-3">
            {workspacesById[workspaceId] ? (
              <IamEntityIdentityCard
                title={workspacesById[workspaceId].name}
                subtitle={workspacesById[workspaceId].code}
                meta={workspacesById[workspaceId].status}
                id={workspaceId}
              />
            ) : (
              <IamEntityIdentityCard title={workspaceId} id={workspaceId} />
            )}
          </div>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen((v) => !v)} icon={!createOpen ? <UserPlus size={16} /> : undefined}>
          {createOpen ? 'Cancel' : 'Assign role'}
        </Button>
      </div>

      {createOpen && (
        <div className="mb-6 border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="semibold" className="mb-3">
            Assign role in this workspace
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-md">
            <div>
              <Typography variant="small" tone="muted" className="mb-1.5">Assignee type</Typography>
              <Select
                value={form.assigneeType}
                onValueChange={(v: string) => setForm((f) => ({ ...f, assigneeType: v }))}
                options={ASSIGNEE_TYPE_OPTIONS}
              />
            </div>
            <Input
              label="Assignee ID"
              value={form.assigneeId}
              onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
              placeholder="Enter user or role ID"
            />
            {roles.length > 0 ? (
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">Role</Typography>
                <Select
                  value={form.roleId}
                  onValueChange={(v: string) => setForm((f) => ({ ...f, roleId: v }))}
                  options={roleOptions}
                />
              </div>
            ) : (
              <Input
                label="Role ID"
                value={form.roleId}
                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                placeholder="Enter role ID"
              />
            )}
            <Stack direction="horizontal" spacing="sm">
              <Button
                variant="primary"
                disabled={creating || !form.assigneeId.trim() || !form.roleId.trim()}
                onClick={() => void handleCreate()} icon={<UserPlus size={16} />}>
                {creating ? 'Assigning…' : 'Assign'}
              </Button>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </div>
      )}

      {loading ? (
        <PageSkeleton variant="split" />
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Assignee type</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Assigned at</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Badge tone="neutral">
                      {a.assigneeType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.assigneeType === 'USER' && usersById[a.assigneeId] ? (
                      <IamEntityIdentityCard
                        title={usersById[a.assigneeId].fullName || usersById[a.assigneeId].username}
                        subtitle={`@${usersById[a.assigneeId].username}`}
                        meta={usersById[a.assigneeId].email}
                        id={a.assigneeId}
                        avatarFallback={usersById[a.assigneeId].fullName || usersById[a.assigneeId].username}
                      />
                    ) : a.assigneeType === 'ROLE' && rolesById[a.assigneeId] ? (
                      <IamEntityIdentityCard
                        title={rolesById[a.assigneeId].name}
                        subtitle={rolesById[a.assigneeId].code}
                        meta={rolesById[a.assigneeId].roleScope}
                        id={a.assigneeId}
                      />
                    ) : (
                      <IamEntityIdentityCard title={a.assigneeId} id={a.assigneeId} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rolesById[a.roleId] ? (
                      <IamEntityIdentityCard
                        title={rolesById[a.roleId].name}
                        subtitle={rolesById[a.roleId].code}
                        meta={rolesById[a.roleId].roleScope}
                        id={a.roleId}
                      />
                    ) : (
                      <IamEntityIdentityCard title={a.roleId} id={a.roleId} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {a.assignedAt ? formatDate(a.assignedAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <IamStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="xs">
                      {a.status.toUpperCase() !== 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          disabled={actingId === a.id}
                          onClick={() => void runAction(a.id, 'activate')} icon={<Check size={16} />}>
                          Activate
                        </Button>
                      )}
                      {a.status.toUpperCase() === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          disabled={actingId === a.id}
                          onClick={() => void runAction(a.id, 'deactivate')} icon={<Ban size={16} />}>
                          Deactivate
                        </Button>
                      )}
                    </Stack>
                  </td>
                </tr>
              ))}
              {!assignments.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                    No role assignments for this workspace
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 border border-neutral-200 bg-neutral-50 p-4">
        <Typography variant="small" tone="muted">
          Need to manage grants or permissions beyond role assignments?{' '}
          <NextLink href={ADMIN_ROUTES.iamGrantNew} className="text-primary underline">
            Go to Grant Access
          </NextLink>
          {' '}and pre-fill the workspace scope.
        </Typography>
      </div>
    </div>
  )
}
