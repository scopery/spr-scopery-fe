'use client'

import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Stack, Typography, DataTable, Card } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useEmailOutbox } from '../hooks/useEmailOutbox'

function outboxStatusTone(status: string): 'success' | 'error' | 'neutral' {
  if (status === 'SENT') return 'success'
  if (status === 'FAILED') return 'error'
  return 'neutral'
}

function canRetry(status: string): boolean {
  return status !== 'SENT' && status !== 'CANCELLED'
}

function canCancel(status: string): boolean {
  return status === 'PENDING' || status === 'QUEUED'
}

export function OutboxTab() {
  const { outbox, loading, error, forbidden, actingId, retry, cancel } = useEmailOutbox()

  if (loading && outbox.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to the outbox</Typography>
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

  const handleRetry = async (recordId: string) => {
    try {
      await retry(recordId)
      toast.success('Outbox record queued for retry')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleCancel = async (recordId: string) => {
    try {
      await cancel(recordId)
      toast.success('Outbox record cancelled')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <DataTable
        ariaLabel="Outbox Tab"
        rows={outbox}
        rowKey={(r) => String(r.id)}
        emptyMessage="No items."
        columns={[
          {
            id: 'delivery-id',
            header: 'Delivery ID',
            accessor: () => '—',
            kind: 'reference',
            cellClassName: 'text-xs text-neutral-500',
          },
          {
            id: 'provider',
            header: 'Provider',
            accessor: 'provider',
            cellClassName: 'text-neutral-700',
          },
          {
            id: 'status',
            header: 'Status',
            cell: (r) => (
              <>
                <Badge tone={outboxStatusTone(r.status)}>{r.status}</Badge>
              </>
            ),
          },
          {
            id: 'retries',
            header: 'Retries',
            accessor: 'retryCount',
            cellClassName: 'text-neutral-500',
          },
          {
            id: 'scheduled',
            header: 'Scheduled',
            accessor: 'scheduledAt',
            cellClassName: 'text-neutral-500',
          },
          {
            id: 'sent',
            header: 'Sent',
            cell: (r) => <>{r.sentAt ?? '—'}</>,
            cellClassName: 'text-neutral-500',
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (r) => (
              <>
                <Stack direction="horizontal" spacing="sm">
                  {canRetry(r.status) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actingId === r.id}
                      onClick={() => void handleRetry(r.id)}
                    >
                      Retry
                    </Button>
                  )}
                  {canCancel(r.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="error"
                      disabled={actingId === r.id}
                      onClick={() => void handleCancel(r.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </Stack>
              </>
            ),
          },
        ]}
      />
    </div>
  )
}
