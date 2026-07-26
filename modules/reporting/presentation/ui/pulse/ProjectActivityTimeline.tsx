'use client'

import { Stack, Typography } from '@/shared/ui'
import type { ActivityTimelineItem } from '../../../domain/model/project-pulse'
import { PulsePanel, PulseTextAction } from './PulseWidget'

export function ProjectActivityTimeline({ items }: { items: ActivityTimelineItem[] }) {
  if (items.length === 0) return null

  const groups = items.reduce<Record<string, ActivityTimelineItem[]>>((acc, item) => {
    const key = item.dayKey
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <PulsePanel>
      <div className="p-md">
        <Typography variant="h5" className="mb-md">
          Recent project activity
        </Typography>
        <Stack direction="vertical" spacing="md">
          {Object.entries(groups).map(([dayKey, dayItems]) => (
            <div key={dayKey} className="space-y-sm">
              <Typography variant="overline" tone="muted">
                {dayItems[0]?.dayLabel ?? dayKey}
              </Typography>
              <ul className="space-y-sm">
                {dayItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-sm border-b border-neutral-100 pb-sm last:border-b-0 last:pb-0"
                  >
                    <div>
                      <Typography variant="small" className="font-medium text-neutral-900">
                        {item.summary}
                      </Typography>
                      {item.createdAt ? (
                        <Typography variant="caption" tone="muted">
                          {new Date(item.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      ) : null}
                    </div>
                    {item.href ? <PulseTextAction href={item.href}>Open</PulseTextAction> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Stack>
      </div>
    </PulsePanel>
  )
}
