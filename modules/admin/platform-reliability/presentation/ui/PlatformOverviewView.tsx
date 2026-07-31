'use client'

import { RefreshCw } from 'lucide-react'

import NextLink from 'next/link'
import { Badge, Button, Card, Typography, PageSkeleton } from '@/shared/ui'
import { usePlatformOverview } from '../hooks/usePlatformOverview'
import type { PlatformHealthStatus } from '../../domain/model/platform-reliability'

function healthTone(status: PlatformHealthStatus): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'HEALTHY':
      return 'success'
    case 'DEGRADED':
      return 'warning'
    case 'CRITICAL':
      return 'error'
    default:
      return 'neutral'
  }
}

export function PlatformOverviewView() {
  const { metrics, health, loading, error, refetch } = usePlatformOverview()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Platform reliability
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Observability for audit, activity, outbox, jobs, and errors.
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="soft" tone={healthTone(health)}>
            {health.toLowerCase()}
          </Badge>
          <Button variant="secondary" onClick={() => void refetch()} icon={<RefreshCw size={16} />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Typography tone="error" className="mb-4">
          {error}
        </Typography>
      )}

      {loading ? (
        <PageSkeleton variant="cards" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((m) => (
            <Card
              as={NextLink}
              key={m.id}
              href={m.href}
              className="p-5 transition-colors hover:border-neutral-400"
            >
              <Typography variant="small" tone="muted" className="mb-2">
                {m.label}
              </Typography>
              <Typography as="p" size="xl" weight="bold" className="mb-1">
                {m.available && m.value != null ? m.value.toLocaleString() : '—'}
              </Typography>
              {m.note && (
                <Typography variant="small" tone="muted">
                  {m.note}
                </Typography>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
