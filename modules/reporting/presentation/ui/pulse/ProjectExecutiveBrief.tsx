'use client'

import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { healthBadgeTone } from '../../../domain/rules/project-pulse.rules'
import type { ProjectPulseBrief } from '../../../domain/model/project-pulse'
import { cn } from '@/utils/cn'
import { ProjectHealthStatus } from '../../../domain/enums/project-health.enum'
import { PulsePanel } from './PulseWidget'

function healthBanner(status: ProjectPulseBrief['health']): string {
  switch (status) {
    case ProjectHealthStatus.OnTrack:
      return 'bg-success/10'
    case ProjectHealthStatus.NeedsAttention:
      return 'bg-warning/10'
    case ProjectHealthStatus.AtRisk:
    case ProjectHealthStatus.OffTrack:
      return 'bg-error/10'
    default:
      return 'bg-neutral-50'
  }
}

export function ProjectPulseHeader({
  brief,
  onRefresh,
  refreshing,
}: {
  brief: ProjectPulseBrief
  onRefresh: () => void
  refreshing?: boolean
}) {
  const updatedLabel = brief.updatedAt
    ? `Updated ${new Date(brief.updatedAt).toLocaleString()}`
    : 'Updated just now'

  return (
    <div className="flex flex-wrap items-end justify-between gap-md">
      <div className="space-y-xs">
        <Typography variant="h2">Project Pulse</Typography>
        <Typography variant="body" className="text-neutral-700">
          {brief.projectCode ? (
            <span className="text-neutral-500">{brief.projectCode}</span>
          ) : null}
          {brief.projectCode ? ' · ' : ''}
          {brief.projectName}
        </Typography>
      </div>
      <Stack direction="horizontal" spacing="sm" className="items-center">
        <Typography variant="caption" tone="muted">
          {updatedLabel}
        </Typography>
        <Button type="button" variant="outline" size="sm" loading={refreshing} onClick={onRefresh}>
          Refresh
        </Button>
      </Stack>
    </div>
  )
}

export function ProjectExecutiveBrief({ brief }: { brief: ProjectPulseBrief }) {
  return (
    <PulsePanel>
      <div className={cn('space-y-md p-md', healthBanner(brief.health))}>
        <div className="flex flex-wrap items-center gap-sm">
          <Badge tone={healthBadgeTone(brief.health)} variant="solid" size="sm">
            {brief.healthLabel}
          </Badge>
          <Typography variant="body" className="max-w-3xl text-neutral-900">
            {brief.narrative}
          </Typography>
        </div>

        {brief.topMetrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
            {brief.topMetrics.map((metric) => (
              <div key={metric.key} className="bg-white/80 px-sm py-sm">
                <Typography variant="caption" tone="muted">
                  {metric.label}
                </Typography>
                <Typography variant="h4" className="text-neutral-950">
                  {metric.value}
                </Typography>
              </div>
            ))}
          </div>
        ) : null}

        {(brief.drivers.length > 0 || brief.positiveSignals.length > 0) ? (
          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            <div>
              <Typography variant="overline" tone="muted">
                Main drivers
              </Typography>
              {brief.drivers.length === 0 ? (
                <Typography variant="small" tone="muted">
                  No active risk drivers.
                </Typography>
              ) : (
                <ul className="mt-xs space-y-xs">
                  {brief.drivers.map((driver) => (
                    <li key={driver}>
                      <Typography variant="small">{driver}</Typography>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Typography variant="overline" tone="muted">
                Positive signals
              </Typography>
              {brief.positiveSignals.length === 0 ? (
                <Typography variant="small" tone="muted">
                  No positive signals yet.
                </Typography>
              ) : (
                <ul className="mt-xs space-y-xs">
                  {brief.positiveSignals.map((signal) => (
                    <li key={signal}>
                      <Typography variant="small">{signal}</Typography>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </PulsePanel>
  )
}
