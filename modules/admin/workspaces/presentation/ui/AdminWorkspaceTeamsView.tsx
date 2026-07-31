'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Archive, ArrowLeft, Check } from 'lucide-react'
import { Badge, Button, PageSkeleton, Typography, DataTable } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { useWorkspaceTeams } from '../hooks/useWorkspacesV1'

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

export function AdminWorkspaceTeamsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, totalElements, loading, error, actingId, activateTeam, archiveTeam } =
    useWorkspaceTeams(workspaceId)

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
          Teams
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Teams assigned to this workspace ({totalElements}).
        </Typography>
      </div>

      <div className="overflow-hidden border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Admin Workspace Teams"
          rows={items}
          rowKey={(t) => String(t.id)}
          emptyMessage="No items."
          columns={[
            { id: 'name', header: 'Name', accessor: 'name' },
            {
              id: 'code',
              header: 'Code',
              accessor: 'code',
              kind: 'code',
              cellClassName: 'text-xs',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (t) => {
                const active = t.status === 'ACTIVE'
                return (
                  <>
                    <Badge variant="solid" tone={active ? 'success' : 'neutral'}>
                      {formatStatusLabel(t.status)}
                    </Badge>
                  </>
                )
              },
            },
            {
              id: 'updated',
              header: 'Updated',
              cell: (t) => {
                const active = t.status === 'ACTIVE'
                return <>{formatDate(t.updatedAt)}</>
              },
              cellClassName: 'text-neutral-600',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (t) => {
                const active = t.status === 'ACTIVE'
                return (
                  <>
                    {active ? (
                      <Button
                        variant="ghost"
                        disabled={actingId === t.id}
                        onClick={() => void archiveTeam(t.id)}
                        icon={<Archive size={16} />}
                      >
                        Archive
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        disabled={actingId === t.id}
                        onClick={() => void activateTeam(t.id)}
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
