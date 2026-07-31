'use client'

import { Badge, PageSkeleton, Typography, DataTable, Card } from '@/shared/ui'
import { useEmailDeliveries } from '../hooks/useEmailDeliveries'

function deliveryStatusTone(status: string): 'success' | 'error' | 'neutral' {
  if (status === 'DELIVERED' || status === 'SENT') return 'success'
  if (status === 'FAILED' || status === 'BOUNCED') return 'error'
  return 'neutral'
}

export function DeliveriesTab() {
  const { deliveries, loading, error, forbidden } = useEmailDeliveries()

  if (loading && deliveries.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to email deliveries</Typography>
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
        ariaLabel="Deliveries Tab"
        rows={deliveries}
        rowKey={(d) => String(d.id)}
        emptyMessage="No items."
        columns={[
          {
            id: 'recipient',
            header: 'Recipient',
            accessor: 'recipientEmail',
            cellClassName: 'text-xs text-neutral-700',
          },
          {
            id: 'subject',
            header: 'Subject',
            cell: (d) => (
              <>
                <Typography weight="medium">{d.subject}</Typography>
              </>
            ),
          },
          {
            id: 'event',
            header: 'Event',
            accessor: 'eventType',
            cellClassName: 'text-xs text-neutral-500',
          },
          {
            id: 'status',
            header: 'Status',
            cell: (d) => (
              <>
                <Badge tone={deliveryStatusTone(d.status)}>{d.status}</Badge>
              </>
            ),
          },
          {
            id: 'created',
            header: 'Created',
            accessor: 'createdAt',
            cellClassName: 'text-neutral-500',
          },
        ]}
      />
    </div>
  )
}
