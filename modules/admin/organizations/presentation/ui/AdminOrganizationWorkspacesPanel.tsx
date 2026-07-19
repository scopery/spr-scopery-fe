'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Badge, Typography, Skeleton } from '@/shared/ui'
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
    return (
      <Skeleton variant="rectangular" width="100%" height={120} />
    )
  }

  if (error) {
    return <Typography tone="error">{error}</Typography>
  }

  return (
    <div className="overflow-hidden border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Code</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                No workspaces
              </td>
            </tr>
          ) : (
            items.map((w) => (
              <tr key={w.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <NextLink
                    href={ADMIN_ROUTES.workspace(w.id)}
                    className="font-medium text-primary hover:underline"
                  >
                    {w.name}
                  </NextLink>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{w.code}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="solid"
                    tone={String(w.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
                  >
                    {String(w.status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
