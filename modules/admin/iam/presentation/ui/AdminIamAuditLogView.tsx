'use client'

import { Clock } from 'lucide-react'
import { Typography, Badge, PageSkeleton, DataTable } from '@/shared/ui'
import { useIamAuditEvents } from '../hooks/useIamAuditEvents'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function severityTone(severity: string): 'success' | 'warning' | 'error' | 'neutral' {
  switch (severity.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return 'error'
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'success'
    default:
      return 'neutral'
  }
}

export function AdminIamAuditLogView() {
  const { items, loading, error } = useIamAuditEvents()

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Audit
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Read-only log of IAM access changes across the platform.
        </Typography>
      </div>

      {loading ? (
        <PageSkeleton variant="list" />
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-8 py-16 text-center">
          <Clock size={40} className="mb-4 text-neutral-300" />
          <Typography as="h2" size="lg" weight="semibold" className="mb-2">
            No audit history available
          </Typography>
          <Typography as="p" tone="muted" className="max-w-md text-sm">
            No IAM audit events were returned. Grants, revocations, and role assignment changes will
            appear here when recorded by the audit log API.
          </Typography>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <DataTable
            ariaLabel="Admin Iam Audit Log"
            rows={items}
            rowKey={(event) => String(event.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'when',
                header: 'When',
                cell: (event) => <>{formatDate(event.occurredAt)}</>,
                cellClassName: 'text-neutral-600 whitespace-nowrap',
              },
              { id: 'event', header: 'Event', accessor: 'eventType', cellClassName: 'text-xs' },
              {
                id: 'severity',
                header: 'Severity',
                cell: (event) => (
                  <>
                    <Badge tone={severityTone(event.severity)}>{event.severity}</Badge>
                  </>
                ),
              },
              {
                id: 'actor',
                header: 'Actor',
                accessor: (event) => event.actorType ?? '—',
                cellClassName: 'text-xs',
              },
              {
                id: 'resource',
                header: 'Resource',
                cell: (event) => (
                  <>
                    {event.resourceType ?? '—'}
                    {event.resourceRefId ? (
                      <div className="text-neutral-500">{event.resourceRefId}</div>
                    ) : null}
                  </>
                ),
                cellClassName: 'text-xs',
              },
              { id: 'reason', header: 'Reason', cell: (event) => <>{event.reason ?? '—'}</> },
              {
                id: 'trace',
                header: 'Trace',
                cell: (event) => <>{event.traceId || '—'}</>,
                cellClassName: 'text-xs',
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
