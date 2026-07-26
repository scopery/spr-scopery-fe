'use client'

import { Stack, Typography } from '@/shared/ui'
import type { ChangeSinceInsight } from '../../../domain/model/project-pulse'
import { PulsePanel, PulseTextAction } from './PulseWidget'

export function ProjectChangeSinceLastVisit({ insight }: { insight: ChangeSinceInsight }) {
  if (!insight.available || insight.items.length === 0) return null

  return (
    <PulsePanel>
      <div className="p-md">
        <Typography variant="h5">What changed</Typography>
        <Typography variant="caption" tone="muted" className="mb-sm block">
          {insight.periodLabel}
        </Typography>
        <Stack direction="vertical" spacing="sm">
          {insight.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-sm border-b border-neutral-100 pb-sm last:border-b-0 last:pb-0"
            >
              <Typography variant="small" className="text-neutral-800">
                {item.text}
              </Typography>
              {item.href ? <PulseTextAction href={item.href}>Review</PulseTextAction> : null}
            </div>
          ))}
        </Stack>
      </div>
    </PulsePanel>
  )
}
