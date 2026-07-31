'use client'

import { Badge, Card, Typography } from '@/shared/ui'
import type { PortfolioSummary } from '../../domain/rules/portfolio.rules'
import { portfolioMetricTone } from './portfolioStatusTones'

interface PortfolioHealthWidgetProps {
  summary: PortfolioSummary
}

export function PortfolioHealthWidget({ summary }: PortfolioHealthWidgetProps) {
  if (!summary.healthAvailable) {
    return (
      <Card as="section">
        <header className="border-b border-neutral-200 px-4 py-3">
          <Typography as="h2" size="sm" weight="semibold">
            Portfolio health
          </Typography>
        </header>
        <div className="px-4 py-6">
          <Typography variant="small" tone="muted">
            Health unavailable
          </Typography>
        </div>
      </Card>
    )
  }

  const rows = [
    { label: 'On track', value: summary.onTrack ?? 0, filter: 'on_track' as const },
    { label: 'At risk', value: summary.atRisk ?? 0, filter: 'at_risk' as const },
    { label: 'Blocked', value: summary.blocked ?? 0, filter: 'blocked' as const },
  ]

  const drivers = [
    summary.blocked
      ? {
          label: 'Blocked work',
          value: `${summary.blocked} Projects`,
          filter: 'blocked' as const,
        }
      : null,
    summary.atRisk
      ? {
          label: 'Schedule / readiness risk',
          value: `${summary.atRisk} Projects`,
          filter: 'at_risk' as const,
        }
      : null,
    summary.unassignedTasks
      ? {
          label: 'Unassigned work',
          value: `${summary.unassignedTasks} Tasks`,
          filter: 'unassigned' as const,
        }
      : null,
    summary.startingSoonPhases
      ? {
          label: 'Phases starting soon',
          value: `${summary.startingSoonPhases} Phases`,
          filter: 'starting_soon' as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string
    value: string
    filter: 'blocked' | 'at_risk' | 'unassigned' | 'starting_soon'
  }>

  return (
    <Card as="section">
      <header className="border-b border-neutral-200 px-4 py-3">
        <Typography as="h2" size="sm" weight="semibold">
          Portfolio health
        </Typography>
      </header>
      <div className="space-y-4 px-4 py-4">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-2">
              <Badge variant="solid" size="sm" tone={portfolioMetricTone(r.filter)}>
                {r.label}
              </Badge>
              <Typography variant="small" weight="medium" className="tabular-nums">
                {r.value} Projects
              </Typography>
            </li>
          ))}
        </ul>
        {drivers.length > 0 ? (
          <div>
            <Typography variant="small" weight="medium" className="mb-2 text-neutral-800">
              Main drivers
            </Typography>
            <ul className="space-y-1.5">
              {drivers.map((d) => (
                <li key={d.label} className="flex items-center justify-between gap-2">
                  <Badge variant="solid" size="sm" tone={portfolioMetricTone(d.filter)}>
                    {d.label}
                  </Badge>
                  <Typography variant="small" className="tabular-nums">
                    {d.value}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
