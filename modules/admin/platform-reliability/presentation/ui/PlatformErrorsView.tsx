'use client'

import { Typography } from '@/shared/ui'
import { PlatformApiUnavailablePanel } from './PlatformApiUnavailablePanel'

export function PlatformErrorsView() {
  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Error monitoring
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Platform error aggregation for operators.
        </Typography>
      </div>
      <PlatformApiUnavailablePanel
        title="Error monitoring unavailable"
        expectedApi="GET /api/platform/errors"
        description="Scaffolded for Phase 04 Đợt 1. Wire when BE exposes an error index API."
      />
    </div>
  )
}
