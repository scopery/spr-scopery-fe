'use client'

import { Badge, Stack, Typography } from '@/shared/ui'
import { AttentionSeverity } from '../../../domain/enums/project-health.enum'
import type { AttentionItem } from '../../../domain/model/project-pulse'
import { PulsePanel, PulseTextAction } from './PulseWidget'

function severityTone(severity: AttentionItem['severity']): 'error' | 'warning' | 'info' {
  if (severity === AttentionSeverity.High) return 'error'
  if (severity === AttentionSeverity.Low) return 'info'
  return 'warning'
}

export function ProjectAttentionQueue({ items }: { items: AttentionItem[] }) {
  return (
    <PulsePanel>
      <div className="p-md">
        <div className="mb-sm flex items-center justify-between gap-sm">
          <Typography variant="h5">Needs your attention</Typography>
          <Badge tone={items.length > 0 ? 'warning' : 'success'} variant="soft" size="sm">
            {items.length}
          </Badge>
        </div>
        {items.length === 0 ? (
          <Typography variant="small" tone="muted">
            No urgent items. Keep monitoring schedule, capacity, and change pressure.
          </Typography>
        ) : (
          <Stack direction="vertical" spacing="sm">
            {items.map((item) => (
              <div key={item.id} className="space-y-xs border-b border-neutral-100 pb-sm last:border-b-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-sm">
                  <Badge tone={severityTone(item.severity)} size="sm" variant="soft">
                    {item.severity}
                  </Badge>
                  <Typography variant="small" className="font-semibold text-neutral-900">
                    {item.title}
                  </Typography>
                </div>
                <Typography variant="caption" className="text-neutral-600">
                  {item.impact}
                </Typography>
                {item.href ? (
                  <div>
                    <PulseTextAction href={item.href}>{item.actionLabel}</PulseTextAction>
                  </div>
                ) : null}
              </div>
            ))}
          </Stack>
        )}
      </div>
    </PulsePanel>
  )
}
