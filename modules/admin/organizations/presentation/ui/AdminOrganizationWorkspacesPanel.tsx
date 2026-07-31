'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Badge, Typography, Skeleton, DataTable } from '@/shared/ui'
import * as workspacesApi from '@/modules/admin/workspaces/infrastructure/api/workspaces.api'
import type { Workspace } from '@/modules/admin/workspaces/domain/model/workspace'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function AdminOrganizationWorkspacesPanel() {
  const { orgId } = useParams<{ orgId: string }>()
  const [items, setItems] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void workspacesApi
      .searchWorkspaces({ organizationId: orgId, page: 0, size: 50 })
      .then((res) => {
        if (!cancelled) setItems(res.items)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load workspaces')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orgId])

  if (loading) {
    return <Skeleton variant="rectangular" width="100%" height={120} />
  }

  if (error) {
    return <Typography tone="error">{error}</Typography>
  }

  return (
    <div className="overflow-hidden border border-neutral-200 bg-white">
      <DataTable
        ariaLabel="Admin Organization Workspaces Panel"
        rows={items}
        rowKey={(w) => String(w.id)}
        emptyMessage="No items."
        columns={[
          {
            id: 'name',
            header: 'Name',
            cell: (w) => (
              <>
                <NextLink
                  href={ADMIN_ROUTES.workspace(w.id)}
                  className="font-medium text-primary hover:underline"
                >
                  {w.name}
                </NextLink>
              </>
            ),
          },
          { id: 'code', header: 'Code', accessor: 'code', kind: 'code', cellClassName: 'text-xs' },
          {
            id: 'status',
            header: 'Status',
            cell: (w) => (
              <>
                <Badge
                  variant="solid"
                  tone={String(w.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
                >
                  {String(w.status)
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              </>
            ),
          },
        ]}
      />
    </div>
  )
}
