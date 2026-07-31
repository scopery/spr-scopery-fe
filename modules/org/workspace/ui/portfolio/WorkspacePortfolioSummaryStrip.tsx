'use client'

import { Card, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { PortfolioSummary } from '../../domain/rules/portfolio.rules'
import type { PortfolioMetricFilter } from '../../domain/rules/portfolio.rules'

interface WorkspacePortfolioSummaryStripProps {
  summary: PortfolioSummary
  activeFilter: PortfolioMetricFilter
  onFilterChange: (filter: PortfolioMetricFilter) => void
}

export function WorkspacePortfolioSummaryStrip({
  summary,
  activeFilter,
  onFilterChange,
}: WorkspacePortfolioSummaryStripProps) {
  if (!summary.healthAvailable) {
    return (
      <Card as="section" className="mb-4 px-4 py-3">
        <Typography variant="small" tone="muted">
          Health unavailable — create projects and phases to unlock portfolio metrics.
        </Typography>
      </Card>
    )
  }

  const metrics: Array<{
    key: PortfolioMetricFilter
    label: string
    value: number | null
    hideZero?: boolean
  }> = [
    { key: 'all', label: 'Projects', value: summary.projectCount },
    { key: 'on_track', label: 'On track', value: summary.onTrack, hideZero: true },
    { key: 'at_risk', label: 'At risk', value: summary.atRisk, hideZero: true },
    { key: 'blocked', label: 'Blocked', value: summary.blocked, hideZero: true },
    { key: 'unassigned', label: 'Unassigned', value: summary.unassignedTasks, hideZero: true },
    {
      key: 'starting_soon',
      label: 'Starting soon',
      value: summary.startingSoonPhases,
      hideZero: true,
    },
  ]

  return (
    <Card className="mb-4 flex flex-wrap gap-px bg-neutral-200">
      {metrics.map((m) => {
        if (m.hideZero && (m.value == null || m.value === 0) && m.key !== 'all') return null
        const suffix =
          m.key === 'unassigned' ? ' Tasks' : m.key === 'starting_soon' ? ' Phases' : ''
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onFilterChange(m.key)}
            className="flex min-w-[110px] flex-1 items-center justify-between gap-2 bg-white px-3 py-3 outline-none transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:outline-none"
          >
            <Typography variant="small" tone="muted">
              {m.label}
              {suffix}
            </Typography>
            <Typography as="span" size="md" weight="medium" className="tabular-nums">
              {m.value ?? '—'}
            </Typography>
          </button>
        )
      })}
    </Card>
  )
}
