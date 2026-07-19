'use client'

import { Typography } from '@/shared/ui'
import { PlatformApiUnavailablePanel } from './PlatformApiUnavailablePanel'

export function PlatformActivityLogsView() {
  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Activity logs
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Business activity across modules (write path exists; admin list API does not yet).
        </Typography>
      </div>
      <PlatformApiUnavailablePanel
        title="Activity log list unavailable"
        expectedApi="GET /api/activity-logs"
        description="Activity rows are written via ActivityLogService, but there is no platform-wide admin search endpoint yet — only project activity-feed."
      />
    </div>
  )
}
