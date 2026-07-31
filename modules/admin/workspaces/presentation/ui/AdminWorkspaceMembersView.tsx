'use client'

import { useMemo } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ban, Check } from 'lucide-react'
import { Badge, Button, PageSkeleton, Typography, DataTable } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { UserIdentity, useResolveUsers } from '@/modules/platform/identity'
import { useWorkspaceMembers } from '../hooks/useWorkspacesV1'

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminWorkspaceMembersView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, totalElements, loading, error, actingId, activateMember, deactivateMember } =
    useWorkspaceMembers(workspaceId)
  const userIds = useMemo(() => items.map((item) => item.userId), [items])
  const { peopleById } = useResolveUsers(userIds)

  if (loading) {
    return <PageSkeleton variant="list" />
  }

  if (error) {
    return (
      <div>
        <NextLink
          href={ADMIN_ROUTES.workspace(workspaceId)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={14} /> Back to workspace
        </NextLink>
        <Typography tone="error">{error}</Typography>
      </div>
    )
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.workspace(workspaceId)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to workspace
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Members
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Workspace membership ({totalElements}). Access roles are managed separately under Access.
        </Typography>
      </div>

      <div className="overflow-hidden border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Admin Workspace Members"
          rows={items}
          rowKey={(m) => String(m.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'user',
              header: 'User',
              cell: (member) => (
                <UserIdentity
                  userId={member.userId}
                  person={peopleById[member.userId]}
                  size="xs"
                  compact
                />
              ),
              kind: 'reference',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (m) => {
                const active = m.status === 'ACTIVE'
                return (
                  <>
                    <Badge variant="solid" tone={active ? 'success' : 'neutral'}>
                      {formatStatusLabel(m.status)}
                    </Badge>
                  </>
                )
              },
            },
            {
              id: 'joined',
              header: 'Joined',
              cell: (m) => {
                const active = m.status === 'ACTIVE'
                return <>{formatDate(m.joinedAt)}</>
              },
              cellClassName: 'text-neutral-600',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (m) => {
                const active = m.status === 'ACTIVE'
                return (
                  <>
                    {active ? (
                      <Button
                        variant="ghost"
                        tone="error"
                        disabled={actingId === m.id}
                        onClick={() => void deactivateMember(m.id)}
                        icon={<Ban size={16} />}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        disabled={actingId === m.id}
                        onClick={() => void activateMember(m.id)}
                        icon={<Check size={16} />}
                      >
                        Activate
                      </Button>
                    )}
                  </>
                )
              },
              cellClassName: 'text-right',
            },
          ]}
        />
      </div>
    </div>
  )
}
