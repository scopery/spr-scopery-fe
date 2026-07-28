'use client'

import { Typography } from '@/shared/ui'
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
      <div className="mb-4 border border-neutral-200 bg-white px-4 py-3">
        <Typography variant="small" tone="muted">
          Health unavailable — create projects and phases to unlock portfolio metrics.
        </Typography>
      </div>
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
    <div className="mb-4 flex flex-wrap gap-px border border-neutral-200 bg-neutral-200">
      {metrics.map((m) => {
        if (m.hideZero && (m.value == null || m.value === 0) && m.key !== 'all') return null
        const suffix =
          m.key === 'unassigned' ? ' Tasks' : m.key === 'starting_soon' ? ' Phases' : ''
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onFilterChange(m.key)}
            className="min-w-[110px] flex-1 bg-white px-3 py-3 transition-colors hover:bg-neutral-50 outline-none focus:outline-none focus-visible:outline-none flex items-center justify-between gap-2"
          >
            <Typography variant="small" tone="muted">
              {m.label}{suffix}
            </Typography>
            <Typography as="span" size="lg" weight="semibold" className="tabular-nums">
              {m.value ?? '—'}
            </Typography>
          </button>
        )
      })}
    </div>
  )
}
