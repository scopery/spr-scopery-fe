'use client'

import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
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
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to the outbox</Typography>
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
      <table className="min-w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">Delivery ID</th>
            <th className="px-4 py-3 font-medium">Provider</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Retries</th>
            <th className="px-4 py-3 font-medium">Scheduled</th>
            <th className="px-4 py-3 font-medium">Sent</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {outbox.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center">
                <Typography variant="small" tone="muted">No outbox records found</Typography>
              </td>
            </tr>
          ) : (
            outbox.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r.deliveryId}</td>
                <td className="px-4 py-3 text-neutral-700">{r.provider}</td>
                <td className="px-4 py-3">
                  <Badge tone={outboxStatusTone(r.status)}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-500">{r.retryCount}</td>
                <td className="px-4 py-3 text-neutral-500">{r.scheduledAt}</td>
                <td className="px-4 py-3 text-neutral-500">{r.sentAt ?? '—'}</td>
                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
