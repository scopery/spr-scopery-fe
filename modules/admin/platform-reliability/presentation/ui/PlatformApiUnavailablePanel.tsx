'use client'

import { Typography } from '@/shared/ui'

export function PlatformApiUnavailablePanel({
  title,
  expectedApi,
  description,
}: {
  title: string
  expectedApi: string
  description?: string
}) {
  return (
    <div className="border border-neutral-200 bg-neutral-50 p-6">
      <Typography as="h2" size="lg" weight="bold" className="mb-2">
        {title}
      </Typography>
      <Typography variant="small" tone="muted" className="mb-3">
        {description ??
          'This screen is scaffolded for Phase 04. The backend admin read API is not available yet, so the table stays empty.'}
      </Typography>
      <Typography as="p" variant="small" className="font-mono text-xs text-neutral-600">
        Expected: {expectedApi}
      </Typography>
    </div>
  )
}
