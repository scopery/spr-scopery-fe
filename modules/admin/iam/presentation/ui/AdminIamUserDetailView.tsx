'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ban, Check, Info } from 'lucide-react'
import { Typography, Button, Badge, Stack, PageSkeleton, DataTable, Card } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamUserDetail } from '../hooks/useIamUserDetail'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'

type Tab = 'profile' | 'roles' | 'effective-access'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'roles', label: 'Roles' },
  { id: 'effective-access', label: 'Access Summary' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminIamUserDetailView() {
  const { userId } = useParams<{ userId: string }>()
  const { user, assignments, loading, error, actingId, runAction } = useIamUserDetail(userId)
  const { rolesById, workspacesById } = useIamIdentityDirectory({
    roleIds: assignments.map((assignment) => assignment.roleId),
    workspaceIds: assignments.map((assignment) => assignment.workspaceId),
  })
  const [tab, setTab] = useState<Tab>('profile')

  if (loading) {
    return <PageSkeleton variant="detail" />
  }

  if (error || !user) {
    return (
      <div>
        <NextLink
          href={ADMIN_ROUTES.iamUsers}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={14} /> Back to Users
        </NextLink>
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error ?? 'User not found'}
          </Typography>
        </div>
      </div>
    )
  }

  const activeAssignments = assignments.filter((a) => a.status.toUpperCase() === 'ACTIVE')

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamUsers}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Users
      </NextLink>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Typography as="h1" size="lg" weight="semibold">
              {user.fullName || user.username}
            </Typography>
            <IamStatusBadge status={user.status} />
          </div>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            {user.email}
          </Typography>
        </div>
        <Stack direction="horizontal" spacing="sm">
          {user.status.toUpperCase() !== 'ACTIVE' && (
            <Button
              variant="outline"
              disabled={actingId === user.id}
              onClick={() => void runAction('activate')}
              icon={<Check size={16} />}
            >
              Activate
            </Button>
          )}
          {user.status.toUpperCase() === 'ACTIVE' && (
            <Button
              variant="outline"
              disabled={actingId === user.id}
              onClick={() => void runAction('deactivate')}
              icon={<Ban size={16} />}
            >
              Deactivate
            </Button>
          )}
          {user.status.toUpperCase() !== 'SUSPENDED' && (
            <Button
              variant="outline"
              disabled={actingId === user.id}
              onClick={() => void runAction('suspend')}
              icon={<Ban size={16} />}
            >
              Suspend
            </Button>
          )}
        </Stack>
      </div>

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

      {tab === 'profile' && (
        <Card className="max-w-lg">
          <div className="divide-y divide-neutral-100">
            {[
              { label: 'Username', value: user.username },
              { label: 'Email', value: user.email },
              { label: 'Full Name', value: user.fullName || '—' },
              { label: 'Status', value: user.status },
              { label: 'Created', value: formatDate(user.createdAt) },
              { label: 'Updated', value: formatDate(user.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-4 px-4 py-3">
                <Typography variant="small" tone="muted" className="w-28 shrink-0 pt-0.5">
                  {label}
                </Typography>
                <Typography variant="small" className="flex-1 break-all">
                  {value}
                </Typography>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'roles' && (
        <div>
          {assignments.length === 0 ? (
            <div className="border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center">
              <Typography tone="muted" variant="small">
                No role assignments found for this user.
              </Typography>
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200">
              <DataTable
                ariaLabel="Admin Iam User Detail"
                rows={assignments}
                rowKey={(a) => String(a.id)}
                emptyMessage="No items."
                columns={[
                  {
                    id: 'role',
                    header: 'Role',
                    accessor: (assignment) =>
                      rolesById[assignment.roleId]?.name ??
                      rolesById[assignment.roleId]?.code ??
                      '—',
                    kind: 'reference',
                    cellClassName: 'text-xs',
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
                    header: 'Assigned At',
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
                ]}
              />
            </div>
          )}
        </div>
      )}

      {tab === 'effective-access' && (
        <div>
          <div className="mb-4 flex items-start gap-2 border border-blue-200 bg-blue-50 p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
            <Typography variant="small" className="text-blue-700">
              This summary shows direct role assignments for this user. Full inheritance chain
              (team-based and organization-level access) requires a dedicated backend endpoint that
              is not yet available.
            </Typography>
          </div>

          {activeAssignments.length === 0 ? (
            <div className="border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center">
              <Typography tone="muted" variant="small">
                No active access found for this user.
              </Typography>
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200">
              <DataTable
                ariaLabel="Admin Iam User Detail"
                rows={activeAssignments}
                rowKey={(a) => String(a.id)}
                emptyMessage="No items."
                columns={[
                  {
                    id: 'role',
                    header: 'Role',
                    accessor: (assignment) =>
                      rolesById[assignment.roleId]?.name ??
                      rolesById[assignment.roleId]?.code ??
                      '—',
                    kind: 'reference',
                    cellClassName: 'text-xs',
                  },
                  {
                    id: 'scope',
                    header: 'Scope',
                    cell: (a) => (
                      <>
                        <Badge tone="neutral">{a.workspaceId ? 'Workspace' : 'System'}</Badge>
                      </>
                    ),
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
                    id: 'source',
                    header: 'Source',
                    cell: () => (
                      <>
                        <Badge tone="info">Direct assignment</Badge>
                      </>
                    ),
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
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
