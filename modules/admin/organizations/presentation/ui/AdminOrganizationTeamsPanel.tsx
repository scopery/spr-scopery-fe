'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Badge, Typography, Skeleton, DataTable } from '@/shared/ui'
import * as orgTeamsApi from '@/modules/org/teams/api/org-teams.api'
import { OrgTeamStatus } from '@/modules/org/teams/model/enums/org-team.enum'
import type { OrgTeam } from '@/modules/org/teams/model/org-team'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function AdminOrganizationTeamsPanel() {
  const { orgId } = useParams<{ orgId: string }>()
  const [items, setItems] = useState<OrgTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void orgTeamsApi
      .searchOrgTeams(orgId, { page: 0, size: 50 })
      .then((res) => {
        if (!cancelled) setItems(res.items)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load teams')
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
    <div>
      <Typography as="p" variant="small" tone="muted" className="mb-4">
        Organization teams. Open a workspace to assign a team or manage members in context.
      </Typography>
      <div className="overflow-hidden border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Admin Organization Teams Panel"
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
              cell: (t) => (
                <>
                  <Badge
                    variant="solid"
                    tone={t.status === OrgTeamStatus.Active ? 'success' : 'neutral'}
                  >
                    {t.status
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
      <Typography variant="small" tone="muted" className="mt-4">
        Manage workspace assignment from{' '}
        <NextLink href={ADMIN_ROUTES.workspaces} className="text-primary hover:underline">
          Workspaces
        </NextLink>
        .
      </Typography>
    </div>
  )
}
