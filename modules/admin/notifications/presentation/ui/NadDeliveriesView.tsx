'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
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
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center">
                  <Typography variant="small" tone="muted">
                    No deliveries
                  </Typography>
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" className="font-mono">
                      {d.id.slice(0, 8)}…
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{d.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Typography as="h2" weight="semibold" className="mb-3">
        Outbox
      </Typography>
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {outbox.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center">
                  <Typography variant="small" tone="muted">
                    No outbox items
                  </Typography>
                </td>
              </tr>
            ) : (
              outbox.map((o) => (
                <tr key={o.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" className="font-mono">
                      {o.id.slice(0, 8)}…
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
