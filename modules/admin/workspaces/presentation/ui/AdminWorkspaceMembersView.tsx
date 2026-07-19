'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ban, Check } from 'lucide-react'
import { Badge, Button, PageSkeleton, Typography } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Joined</th>
              <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No members
                </td>
              </tr>
            ) : (
              items.map((m) => {
                const active = m.status === 'ACTIVE'
                return (
                  <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{m.userId}</td>
                    <td className="px-4 py-3">
                      <Badge variant="solid" tone={active ? 'success' : 'neutral'}>
                        {formatStatusLabel(m.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(m.joinedAt)}</td>
                    <td className="px-4 py-3 text-right">
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
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
