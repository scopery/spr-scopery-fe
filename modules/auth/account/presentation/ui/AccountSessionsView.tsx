'use client'

import { Ban, RefreshCw } from 'lucide-react'

import { toast } from 'sonner'
import { Badge, Button, Card, DataTable, Stack, Typography, PageSkeleton } from '@/shared/ui'
import { useAccountSessions } from '../hooks/useAccountSessions'

export function AccountSessionsView() {
  const { items, loading, actingId, refetch, revoke } = useAccountSessions()

  const handleRevoke = async (sessionId: string) => {
    try {
      await revoke(sessionId)
      toast.success('Session revoked')
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  if (loading) {
    return <PageSkeleton variant="list" />
  }

  return (
    <Card className="border border-neutral-200 bg-white p-3">
      <Typography as="h2" size="md" weight="medium" className="mb-1">
        Active sessions
      </Typography>
      <Typography as="p" variant="small" tone="muted" className="mb-2">
        Devices and browsers signed in to your account.
      </Typography>
      <DataTable
        ariaLabel="Active sessions"
        rows={items}
        rowKey={(item) => item.id}
        emptyMessage="No sessions found"
        columns={[
          {
            id: 'device',
            header: 'Device',
            cell: (item) => (
              <>
                {item.deviceName ?? item.userAgent ?? 'Unknown device'}
                {item.current ? (
                  <Badge tone="success" className="ml-2">
                    Current
                  </Badge>
                ) : null}
              </>
            ),
          },
          { id: 'ip', header: 'IP', accessor: (item) => item.ipAddress ?? '—' },
          {
            id: 'lastActive',
            header: 'Last active',
            accessor: (item) => item.lastActiveAt ?? item.createdAt,
          },
          {
            id: 'status',
            header: 'Status',
            cell: (item) => (
              <Badge
                variant="solid"
                tone={String(item.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
              >
                {String(item.status)
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (item) => (
              <Button
                variant="ghost"
                disabled={item.current || actingId === item.id}
                onClick={() => void handleRevoke(item.id)}
                icon={<Ban size={16} />}
              >
                Revoke
              </Button>
            ),
          },
        ]}
      />
      <Stack direction="horizontal" spacing="sm" className="mt-4">
        <Button
          variant="neutral-flat"
          onClick={() => void refetch()}
          icon={<RefreshCw size={16} />}
        >
          Refresh
        </Button>
      </Stack>
    </Card>
  )
}
