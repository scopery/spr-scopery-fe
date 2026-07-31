'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ban, Check, Pencil, Save } from 'lucide-react'
import {
  Typography,
  Button,
  Badge,
  Stack,
  Input,
  PageSkeleton,
  DataTable, Card,
} from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamRoleDetail } from '../hooks/useIamRoleDetail'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'

type Tab = 'info' | 'assignments'

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Basic Info' },
  { id: 'assignments', label: 'Assignments' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminIamRoleDetailView() {
  const { roleId } = useParams<{ roleId: string }>()
  const { role, assignments, loading, error, actingId, updating, updateRole, runAssignmentAction } =
    useIamRoleDetail(roleId)
  const { usersById, rolesById, workspacesById } = useIamIdentityDirectory({
    userIds: assignments
      .filter((assignment) => assignment.assigneeType === 'USER')
      .map((assignment) => assignment.assigneeId),
    roleIds: [
      role?.parentRoleId,
      ...assignments
        .filter((assignment) => assignment.assigneeType === 'ROLE')
        .map((assignment) => assignment.assigneeId),
    ],
    workspaceIds: [role?.workspaceId, ...assignments.map((assignment) => assignment.workspaceId)],
  })
  const [tab, setTab] = useState<Tab>('info')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  const openEdit = () => {
    if (!role) return
    setEditForm({ name: role.name, description: role.description ?? '' })
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    try {
      await updateRole({
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
      })
      setEditOpen(false)
    } catch {
      // error already toasted
    }
  }

  if (loading) {
    return <PageSkeleton variant="detail" />
  }

  if (error || !role) {
    return (
      <div>
        <NextLink
          href={ADMIN_ROUTES.iamRoles}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={14} /> Back to Roles
        </NextLink>
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error ?? 'Role not found'}
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamRoles}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Roles
      </NextLink>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Typography as="h1" size="lg" weight="semibold">
              {role.name}
            </Typography>
            <IamStatusBadge status={role.status} />
            {role.isSystem && <Badge tone="info">System</Badge>}
          </div>
          <Typography as="p" variant="small" className="mt-1 font-normal text-neutral-500">
            {role.code}
          </Typography>
        </div>
        {!role.isSystem && (
          <Button variant="outline" onClick={openEdit} icon={<Pencil size={16} />}>
            Edit
          </Button>
        )}
      </div>

      {editOpen && (
        <div className="mb-6 border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="semibold" className="mb-3">
            Edit role
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-md">
            <Input
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Description (optional)"
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Stack direction="horizontal" spacing="sm">
              <Button
                variant="primary"
                disabled={updating || !editForm.name.trim()}
                onClick={() => void handleUpdate()}
                icon={<Save size={16} />}
              >
                {updating ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <Card className="max-w-lg">
          <div className="divide-y divide-neutral-100">
            {[
              { label: 'Code', value: role.code, mono: true },
              { label: 'Name', value: role.name },
              { label: 'Description', value: role.description || '—' },
              { label: 'Scope', value: role.roleScope ?? '—' },
              { label: 'Source', value: role.roleSource ?? '—' },
              {
                label: 'Workspace',
                value: role.workspaceId
                  ? workspacesById[role.workspaceId]
                    ? `${workspacesById[role.workspaceId].name} (${workspacesById[role.workspaceId].code})`
                    : '—'
                  : '—',
              },
              {
                label: 'Parent Role',
                value: role.parentRoleId
                  ? rolesById[role.parentRoleId]
                    ? `${rolesById[role.parentRoleId].name} (${rolesById[role.parentRoleId].code})`
                    : '—'
                  : '—',
              },
              { label: 'System role', value: role.isSystem ? 'Yes' : 'No' },
              { label: 'Created', value: formatDate(role.createdAt) },
              { label: 'Updated', value: formatDate(role.updatedAt) },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-start gap-4 px-4 py-3">
                <Typography variant="small" tone="muted" className="w-28 shrink-0 pt-0.5">
                  {label}
                </Typography>
                <Typography
                  variant="small"
                  className={cn('flex-1 break-all', mono && 'text-xs font-normal')}
                >
                  {value}
                </Typography>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'assignments' && (
        <div>
          {assignments.length === 0 ? (
            <div className="border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center">
              <Typography tone="muted" variant="small">
                No assignments found for this role.
              </Typography>
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200">
              <DataTable
                ariaLabel="Admin Iam Role Detail"
                rows={assignments}
                rowKey={(a) => String(a.id)}
                emptyMessage="No items."
                columns={[
                  {
                    id: 'assignee-type',
                    header: 'Assignee type',
                    cell: (a) => (
                      <>
                        <Badge tone="neutral">{a.assigneeType}</Badge>
                      </>
                    ),
                  },
                  {
                    id: 'assignee',
                    header: 'Assignee',
                    accessor: (assignment) => {
                      if (assignment.assigneeType === 'USER') {
                        const user = usersById[assignment.assigneeId]
                        return user?.fullName || user?.username || user?.email || '—'
                      }
                      if (assignment.assigneeType === 'ROLE') {
                        return rolesById[assignment.assigneeId]?.name ?? '—'
                      }
                      return '—'
                    },
                    kind: 'reference',
                  },
                  {
                    id: 'workspace',
                    header: 'Workspace',
                    accessor: (assignment) =>
                      assignment.workspaceId
                        ? (workspacesById[assignment.workspaceId]?.name ??
                          workspacesById[assignment.workspaceId]?.code ??
                          '—')
                        : 'System',
                    kind: 'reference',
                    cellClassName: 'text-xs',
                  },
                  {
                    id: 'assigned-at',
                    header: 'Assigned at',
                    cell: (a) => <>{a.assignedAt ? formatDate(a.assignedAt) : '—'}</>,
                    cellClassName: 'text-neutral-600',
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (a) => (
                      <>
                        <IamStatusBadge status={a.status} />
                      </>
                    ),
                  },
                  {
                    id: 'actions',
                    header: 'Actions',
                    cell: (a) => (
                      <>
                        <Stack direction="horizontal" spacing="xs">
                          {a.status.toUpperCase() !== 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              disabled={actingId === a.id}
                              onClick={() => void runAssignmentAction(a.id, 'activate')}
                              icon={<Check size={16} />}
                            >
                              Activate
                            </Button>
                          )}
                          {a.status.toUpperCase() === 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              disabled={actingId === a.id}
                              onClick={() => void runAssignmentAction(a.id, 'deactivate')}
                              icon={<Ban size={16} />}
                            >
                              Deactivate
                            </Button>
                          )}
                        </Stack>
                      </>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
