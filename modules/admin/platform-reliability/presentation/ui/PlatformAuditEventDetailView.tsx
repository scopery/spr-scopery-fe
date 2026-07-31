'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge, Typography, PageSkeleton, Card } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { usePlatformAuditEventDetail } from '../hooks/usePlatformAuditEventDetail'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

export function PlatformAuditEventDetailView() {
  const { auditEventId } = useParams<{ auditEventId: string }>()
  const { event, loading, error } = usePlatformAuditEventDetail(auditEventId)

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.platformAuditEvents}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to audit events
      </NextLink>

      {error || !event ? (
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error ?? 'Audit event not found'}
          </Typography>
          <Typography variant="small" tone="muted" className="mt-2">
            BE search has no GET-by-id yet; detail resolves from the latest search page.
          </Typography>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Typography as="h1" size="lg" weight="semibold">
              {event.eventType}
            </Typography>
            {event.severity && (
              <Badge variant="soft">
                {event.severity}
              </Badge>
            )}
          </div>

          <div className="mb-4 border border-amber-200 bg-amber-50 p-3">
            <Typography variant="small">
              Immutable audit record — values cannot be edited from the UI.
            </Typography>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <dl className="space-y-3 border border-neutral-200 bg-white p-5 text-sm">
              <Typography as="h2" size="lg" weight="semibold" className="mb-2">
                Summary
              </Typography>
              <div>
                <dt className="text-neutral-500">Occurred</dt>
                <dd>{formatDate(event.occurredAt)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Event ID</dt>
                <dd className="font-mono text-xs">{event.id}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Reason</dt>
                <dd>{event.reason || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Trace ID</dt>
                <dd className="font-mono text-xs">{event.traceId || '—'}</dd>
              </div>
            </dl>

            <dl className="space-y-3 border border-neutral-200 bg-white p-5 text-sm">
              <Typography as="h2" size="lg" weight="semibold" className="mb-2">
                Actor & resource
              </Typography>
              <div>
                <dt className="text-neutral-500">Actor</dt>
                <dd className="font-mono text-xs">
                  {event.actorType ?? '—'} · {event.actorId ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Resource</dt>
                <dd className="font-mono text-xs">
                  {event.resourceType ?? '—'} · {event.resourceRefId ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Organization</dt>
                <dd className="font-mono text-xs">{event.organizationId || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Workspace</dt>
                <dd className="font-mono text-xs">{event.workspaceId || '—'}</dd>
              </div>
            </dl>
          </div>

          {(event.beforeState || event.afterState) && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <Typography weight="semibold" className="mb-2">
                  Before
                </Typography>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-neutral-700">
                  {event.beforeState || '—'}
                </pre>
              </Card>
              <Card className="p-5">
                <Typography weight="semibold" className="mb-2">
                  After
                </Typography>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-neutral-700">
                  {event.afterState || '—'}
                </pre>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
