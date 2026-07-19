'use client'

import { Badge, PageSkeleton, Typography } from '@/shared/ui'
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
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to email deliveries</Typography>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography tone="error">{error}</Typography>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">Recipient</th>
            <th className="px-4 py-3 font-medium">Subject</th>
            <th className="px-4 py-3 font-medium">Event</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center">
                <Typography variant="small" tone="muted">No deliveries found</Typography>
              </td>
            </tr>
          ) : (
            deliveries.map((d) => (
              <tr key={d.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono text-xs text-neutral-700">{d.recipientEmail}</td>
                <td className="px-4 py-3">
                  <Typography weight="medium">{d.subject}</Typography>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{d.eventType}</td>
                <td className="px-4 py-3">
                  <Badge tone={deliveryStatusTone(d.status)}>{d.status}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-500">{d.createdAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
