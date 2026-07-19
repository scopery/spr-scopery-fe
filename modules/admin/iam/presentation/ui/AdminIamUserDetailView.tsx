'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ban, Check, Info } from 'lucide-react'
import { Typography, Button, Badge, Stack, PageSkeleton } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamUserDetail } from '../hooks/useIamUserDetail'
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
  const [tab, setTab] = useState<Tab>('profile')

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
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
              onClick={() => void runAction('activate')} icon={<Check size={16} />}>
              Activate
            </Button>
          )}
          {user.status.toUpperCase() === 'ACTIVE' && (
            <Button
              variant="outline"
              disabled={actingId === user.id}
              onClick={() => void runAction('deactivate')} icon={<Ban size={16} />}>
              Deactivate
            </Button>
          )}
          {user.status.toUpperCase() !== 'SUSPENDED' && (
            <Button
              variant="outline"
              disabled={actingId === user.id}
              onClick={() => void runAction('suspend')} icon={<Ban size={16} />}>
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
        <div className="max-w-lg border border-neutral-200 bg-white">
          <div className="divide-y divide-neutral-100">
            {[
              { label: 'User ID', value: user.id, mono: true },
              { label: 'Username', value: user.username },
              { label: 'Email', value: user.email },
              { label: 'Full Name', value: user.fullName || '—' },
              { label: 'Status', value: user.status },
              { label: 'Created', value: formatDate(user.createdAt) },
              { label: 'Updated', value: formatDate(user.updatedAt) },
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
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Role ID</th>
                    <th className="px-4 py-3 font-medium">Workspace</th>
                    <th className="px-4 py-3 font-medium">Assigned At</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3 font-mono text-xs">{a.roleId}</td>
                      <td className="px-4 py-3 font-mono text-xs">{a.workspaceId ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {a.assignedAt ? formatDate(a.assignedAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <IamStatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              (team-based and organization-level access) requires a dedicated backend endpoint
              that is not yet available.
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
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Role ID</th>
                    <th className="px-4 py-3 font-medium">Scope</th>
                    <th className="px-4 py-3 font-medium">Workspace</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssignments.map((a) => (
                    <tr key={a.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3 font-mono text-xs">{a.roleId}</td>
                      <td className="px-4 py-3">
                        <Badge tone="neutral">
                          {a.workspaceId ? 'Workspace' : 'System'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{a.workspaceId ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone="info">
                          Direct assignment
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <IamStatusBadge status={a.status} />
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
