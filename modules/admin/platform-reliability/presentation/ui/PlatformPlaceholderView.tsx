'use client'

import { Typography } from '@/shared/ui'
import { PlatformApiUnavailablePanel } from './PlatformApiUnavailablePanel'

export function PlatformPlaceholderView({
  title,
  description,
  expectedApi,
}: {
  title: string
  description: string
  expectedApi: string
}) {
  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          {title}
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          {description}
        </Typography>
      </div>
      <PlatformApiUnavailablePanel title={`${title} — pending BE`} expectedApi={expectedApi} />
    </div>
  )
}
