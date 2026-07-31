'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, PageSkeleton, Stack, Typography, DataTable } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as notificationsApi from '../../infrastructure/api/notifications.api'
import type { EmailRule } from '../../domain/model/notification'

export function NadEmailRulesView() {
  const [items, setItems] = useState<EmailRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await notificationsApi.searchEmailRules({ page: 0, size: 50 })
      setItems(page.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && items.length === 0) return <PageSkeleton variant="list" />

  return (
    <div>
      <Typography as="h1" size="lg" weight="semibold" className="mb-6">
        Email rules
      </Typography>
      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Nad Email Rules"
          rows={items}
          rowKey={(r) => String(r.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'code',
              header: 'Code',
              cell: (r) => (
                <>
                  <Typography as="span" variant="small" className="font-normal">
                    {r.code}
                  </Typography>
                </>
              ),
              kind: 'code',
            },
            { id: 'name', header: 'Name', accessor: 'name' },
            {
              id: 'status',
              header: 'Status',
              cell: (r) => (
                <>
                  <Badge tone="neutral">{r.status}</Badge>
                </>
              ),
            },
            { id: 'enabled', header: 'Enabled', cell: (r) => <>{r.enabled ? 'Yes' : 'No'}</> },
            {
              id: 'actions',
              header: 'Actions',
              cell: (r) => (
                <>
                  <Stack direction="horizontal" spacing="sm">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void (
                          r.enabled
                            ? notificationsApi.disableEmailRule(r.id)
                            : notificationsApi.enableEmailRule(r.id)
                        )
                          .then(() => load())
                          .catch((e) => toast.error(getProblemToastMessage(e)))
                      }
                    >
                      {r.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void (
                          r.status === 'ACTIVE'
                            ? notificationsApi.deactivateEmailRule(r.id)
                            : notificationsApi.activateEmailRule(r.id)
                        )
                          .then(() => load())
                          .catch((e) => toast.error(getProblemToastMessage(e)))
                      }
                    >
                      {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
