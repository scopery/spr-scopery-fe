'use client'

import { useMemo } from 'react'
import { PageSkeleton, Typography, DataTable, Card } from '@/shared/ui'
import { UserIdentity, useResolveUsers } from '@/modules/platform/identity'
import { useAdminSuppressions } from '../hooks/useAdminSuppressions'

export function SuppressionsTab() {
  const { suppressions, loading, error, forbidden } = useAdminSuppressions()
  const userIds = useMemo(() => suppressions.map((item) => item.userId), [suppressions])
  const { peopleById } = useResolveUsers(userIds)

  if (loading && suppressions.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to suppressions</Typography>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <Typography tone="error">{error}</Typography>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <DataTable
        ariaLabel="Suppressions Tab"
        rows={suppressions}
        rowKey={(s) => String(s.id)}
        emptyMessage="No items."
        columns={[
          {
            id: 'user',
            header: 'User',
            cell: (item) => (
              <UserIdentity
                userId={item.userId}
                person={peopleById[item.userId]}
                size="xs"
                compact
              />
            ),
            kind: 'reference',
          },
          {
            id: 'channel',
            header: 'Channel',
            accessor: 'channel',
            cellClassName: 'text-neutral-700',
          },
          {
            id: 'category',
            header: 'Category',
            cell: (s) => <>{s.category ?? '—'}</>,
            cellClassName: 'text-neutral-500',
          },
          { id: 'reason', header: 'Reason', accessor: 'reason', cellClassName: 'text-neutral-500' },
          { id: 'source', header: 'Source', accessor: 'source', cellClassName: 'text-neutral-500' },
          {
            id: 'suppressed-at',
            header: 'Suppressed At',
            accessor: 'suppressedAt',
            cellClassName: 'text-neutral-500',
          },
          {
            id: 'expires',
            header: 'Expires',
            cell: (s) => <>{s.expiresAt ?? '—'}</>,
            cellClassName: 'text-neutral-500',
          },
        ]}
      />
    </div>
  )
}
