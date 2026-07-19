'use client'

import { Typography } from '@/shared/ui'
import { PlatformApiUnavailablePanel } from './PlatformApiUnavailablePanel'

export function PlatformTracesView() {
  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Trace explorer
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Correlate requests across audit, outbox, and jobs by trace ID.
        </Typography>
      </div>
      <PlatformApiUnavailablePanel
        title="Trace search unavailable"
        expectedApi="GET /api/platform/traces?traceId="
        description="Audit events already carry traceId. A dedicated platform trace search API is not exposed yet."
      />
    </div>
  )
}
