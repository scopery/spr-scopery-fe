'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, PageSkeleton, Stack, Typography, DataTable } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as notificationsApi from '../../infrastructure/api/notifications.api'
import type { EmailDelivery, EmailOutbox } from '../../domain/model/notification'

export function NadDeliveriesView() {
  const [deliveries, setDeliveries] = useState<EmailDelivery[]>([])
  const [outbox, setOutbox] = useState<EmailOutbox[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, o] = await Promise.all([
        notificationsApi.searchEmailDeliveries({ page: 0, size: 50 }),
        notificationsApi.searchEmailOutbox({ page: 0, size: 50 }),
      ])
      setDeliveries(d.items ?? [])
      setOutbox(o.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && deliveries.length === 0 && outbox.length === 0) {
    return <PageSkeleton variant="list" />
  }

  return (
    <div>
      <Typography as="h1" size="lg" weight="semibold" className="mb-6">
        Delivery operations
      </Typography>
      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <Typography as="h2" weight="semibold" className="mb-3">
        Deliveries
      </Typography>
      <div className="mb-8 overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Nad Deliveries"
          rows={deliveries}
          rowKey={(d) => String(d.id)}
          emptyMessage="No items."
          columns={[
            { id: 'id', header: 'ID', accessor: () => '—', kind: 'reference' },
            {
              id: 'status',
              header: 'Status',
              cell: (d) => (
                <>
                  <Badge tone="neutral">{d.status}</Badge>
                </>
              ),
            },
            {
              id: 'created',
              header: 'Created',
              cell: (d) => <>{new Date(d.createdAt).toLocaleString()}</>,
              cellClassName: 'text-neutral-600',
            },
          ]}
        />
      </div>

      <Typography as="h2" weight="semibold" className="mb-3">
        Outbox
      </Typography>
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Nad Deliveries"
          rows={outbox}
          rowKey={(o) => String(o.id)}
          emptyMessage="No items."
          columns={[
            { id: 'id', header: 'ID', accessor: () => '—', kind: 'reference' },
            {
              id: 'status',
              header: 'Status',
              cell: (o) => (
                <>
                  <Badge tone="neutral">{o.status}</Badge>
                </>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (o) => (
                <>
                  <Stack direction="horizontal" spacing="sm">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void notificationsApi
                          .retryEmailOutbox(o.id)
                          .then(() => {
                            toast.success('Retry queued')
                            return load()
                          })
                          .catch((e) => toast.error(getProblemToastMessage(e)))
                      }
                    >
                      Retry
                    </Button>
                  </Stack>
                </>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
