'use client'

import { Play, RefreshCw } from 'lucide-react'

import { useState } from 'react'
import NextLink from 'next/link'
import { Badge, Button, Input, Typography, Skeleton } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { usePlatformAuditEvents } from '../hooks/usePlatformAuditEvents'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PlatformAuditEventsListView() {
  const [eventType, setEventType] = useState('')
  const [severity, setSeverity] = useState('')
  const [applied, setApplied] = useState<{ eventType?: string; severity?: string }>({})
  const { items, totalElements, loading, error, refetch } = usePlatformAuditEvents(applied)

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Audit events
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Immutable security and access audit trail ({totalElements.toLocaleString()} total).
        </Typography>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <Input
            label="Event type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            fullWidth
            placeholder="e.g. ORG_TEAM_CREATED"
          />
        </div>
        <div className="min-w-[140px]">
          <Input
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            fullWidth
            placeholder="INFO"
          />
        </div>
        <Button
          variant="primary"
          onClick={() =>
            setApplied({
              eventType: eventType.trim() || undefined,
              severity: severity.trim() || undefined,
            })
          } icon={<Play size={16} />}>
          Apply
        </Button>
        <Button variant="secondary" onClick={() => void refetch()} icon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </div>

      {error && (
        <Typography tone="error" className="mb-4">
          {error}
        </Typography>
      )}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Resource</th>
              <th className="px-4 py-3 font-medium">Trace</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <Skeleton variant="rectangular" width="100%" height={80} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  No audit events
                </td>
              </tr>
            ) : (
              items.map((event) => (
                <tr key={event.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                    {formatDate(event.occurredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <NextLink
                      href={ADMIN_ROUTES.platformAuditEvent(event.id)}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {event.eventType}
                    </NextLink>
                  </td>
                  <td className="px-4 py-3">
                    {event.severity ? (
                      <Badge variant="soft">
                        {event.severity}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{event.actorId ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {event.resourceType ?? '—'}
                    {event.resourceRefId ? ` · ${event.resourceRefId.slice(0, 8)}…` : ''}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{event.traceId ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
