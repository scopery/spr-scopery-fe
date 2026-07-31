'use client'

import { Play, RefreshCw } from 'lucide-react'

import { useState } from 'react'
import NextLink from 'next/link'
import { Badge, Button, Input, Typography, Skeleton, DataTable } from '@/shared/ui'
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
          }
          icon={<Play size={16} />}
        >
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
        <DataTable
          ariaLabel="Platform Audit Events List"
          rows={items}
          rowKey={(event) => String(event.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'when',
              header: 'When',
              cell: (event) => <>{formatDate(event.occurredAt)}</>,
              cellClassName: 'whitespace-nowrap text-neutral-600',
            },
            {
              id: 'event',
              header: 'Event',
              cell: (event) => (
                <>
                  <NextLink
                    href={ADMIN_ROUTES.platformAuditEvent(event.id)}
                    className="text-xs font-normal text-primary hover:underline"
                  >
                    {event.eventType}
                  </NextLink>
                </>
              ),
            },
            {
              id: 'severity',
              header: 'Severity',
              cell: (event) => (
                <>{event.severity ? <Badge variant="soft">{event.severity}</Badge> : '—'}</>
              ),
            },
            {
              id: 'actor',
              header: 'Actor',
              cell: (event) => <>{event.actorId ?? '—'}</>,
              cellClassName: 'text-xs',
            },
            {
              id: 'resource',
              header: 'Resource',
              cell: (event) => <>{event.resourceType ?? '—'}</>,
              cellClassName: 'text-xs',
            },
            {
              id: 'trace',
              header: 'Trace',
              cell: (event) => <>{event.traceId ?? '—'}</>,
              cellClassName: 'text-xs',
            },
          ]}
        />
      </div>
    </div>
  )
}
