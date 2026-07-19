'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ban, Check, Pencil, Save } from 'lucide-react'
import { Typography, Button, Badge, Stack, Input, PageSkeleton } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamRoleDetail } from '../hooks/useIamRoleDetail'
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
      await updateRole({ name: editForm.name.trim(), description: editForm.description.trim() || undefined })
      setEditOpen(false)
    } catch {
      // error already toasted
    }
  }

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
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
            {role.isSystem && (
              <Badge tone="info">
                System
              </Badge>
            )}
          </div>
          <Typography as="p" variant="small" className="mt-1 font-mono text-neutral-500">
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
                onClick={() => void handleUpdate()} icon={<Save size={16} />}>
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
        <div className="max-w-lg border border-neutral-200 bg-white">
          <div className="divide-y divide-neutral-100">
            {[
              { label: 'Role ID', value: role.id, mono: true },
              { label: 'Code', value: role.code, mono: true },
              { label: 'Name', value: role.name },
              { label: 'Description', value: role.description || '—' },
              { label: 'Scope', value: role.roleScope ?? '—' },
              { label: 'Source', value: role.roleSource ?? '—' },
              { label: 'Workspace', value: role.workspaceId ?? '—', mono: true },
              { label: 'Parent Role', value: role.parentRoleId ?? '—', mono: true },
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
                  className={cn('flex-1 break-all', mono && 'font-mono text-xs')}
                >
                  {value}
                </Typography>
              </div>
            ))}
          </div>
        </div>
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
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Assignee type</th>
                    <th className="px-4 py-3 font-medium">Assignee ID</th>
                    <th className="px-4 py-3 font-medium">Workspace</th>
                    <th className="px-4 py-3 font-medium">Assigned at</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">
                        <Badge tone="neutral">
                          {a.assigneeType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{a.assigneeId}</td>
                      <td className="px-4 py-3 font-mono text-xs">{a.workspaceId ?? '—'}</td>
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
                              onClick={() => void runAssignmentAction(a.id, 'activate')} icon={<Check size={16} />}>
                              Activate
                            </Button>
                          )}
                          {a.status.toUpperCase() === 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              disabled={actingId === a.id}
                              onClick={() => void runAssignmentAction(a.id, 'deactivate')} icon={<Ban size={16} />}>
                              Deactivate
                            </Button>
                          )}
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
