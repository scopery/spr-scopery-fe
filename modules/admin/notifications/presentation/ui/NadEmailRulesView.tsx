'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
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
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Enabled</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No email rules
                  </Typography>
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" className="font-mono">
                      {r.code}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{r.enabled ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void (r.enabled
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
                          void (r.status === 'ACTIVE'
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
