'use client'

import { Clock } from 'lucide-react'
import { Typography, Badge, PageSkeleton } from '@/shared/ui'
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Trace</th>
              </tr>
            </thead>
            <tbody>
              {items.map((event) => (
                <tr key={event.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                    {formatDate(event.occurredAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{event.eventType}</td>
                  <td className="px-4 py-3">
                    <Badge tone={severityTone(event.severity)}>
                      {event.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {event.actorId ?? '—'}
                    {event.actorType ? (
                      <span className="ml-1 text-neutral-500">({event.actorType})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {event.resourceType ?? '—'}
                    {event.resourceRefId ? (
                      <div className="text-neutral-500">{event.resourceRefId}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{event.reason ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{event.traceId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
