'use client'

import NextLink from 'next/link'
import { Badge, Button, Card, Typography } from '@/shared/ui'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import type { WorkspaceActivityFeedItem } from '../../model/workspace-activity'

interface WorkspaceActivityTimelineProps {
  workspaceId: string
  items: WorkspaceActivityFeedItem[]
  loading?: boolean
  forbidden?: boolean
}

function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function dayGroupLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yday = new Date()
  yday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yday)) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function WorkspaceActivityTimeline({
  workspaceId,
  items,
  loading,
  forbidden,
}: WorkspaceActivityTimelineProps) {
  const groups = new Map<string, WorkspaceActivityFeedItem[]>()
  for (const item of items) {
    const key = dayGroupLabel(item.occurredAt)
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }

  return (
    <Card as="section">
      <header className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <Typography as="h2" size="sm" weight="semibold">
          Recent activity
        </Typography>
        <Button
          as={NextLink}
          href={WORKSPACE_ROUTES.activity(workspaceId)}
          variant="ghost"
          size="sm"
        >
          View all
        </Button>
      </header>

      {forbidden ? (
        <div className="px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            Activity requires workspace manage permission.
          </Typography>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="space-y-2 px-4 py-6" aria-busy="true">
          <div className="h-4 w-1/3 bg-neutral-100" />
          <div className="h-10 w-full bg-neutral-50" />
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            No recent workspace activity.
          </Typography>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {[...groups.entries()].map(([day, dayItems]) => (
            <div key={day} className="px-4 py-3">
              <Typography
                variant="small"
                weight="medium"
                className="mb-2 text-xs uppercase tracking-wide text-neutral-500"
              >
                {day}
              </Typography>
              <ul className="space-y-3">
                {dayItems.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <Typography variant="small" tone="muted" className="w-12 shrink-0 tabular-nums">
                      {formatTime(item.occurredAt)}
                    </Typography>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Typography variant="small" weight="medium">
                          {formatEventType(item.eventType)}
                        </Typography>
                        {item.severity && item.severity !== 'INFO' ? (
                          <Badge
                            variant="solid"
                            size="sm"
                            tone={
                              item.severity === 'CRITICAL' || item.severity === 'ERROR'
                                ? 'error'
                                : item.severity === 'WARN'
                                  ? 'warning'
                                  : 'neutral'
                            }
                          >
                            {item.severity}
                          </Badge>
                        ) : null}
                      </div>
                      {item.reason ? (
                        <Typography variant="small" tone="muted" className="mt-0.5">
                          {item.reason}
                        </Typography>
                      ) : null}
                      {item.resourceType ? (
                        <Typography variant="small" tone="muted" className="mt-0.5 text-xs">
                          {formatEventType(item.resourceType)}
                        </Typography>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
