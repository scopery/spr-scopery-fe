'use client'

import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { WorkInsightBar, WorkItemsInsights } from '../../domain/rules/work-items-insights.rules'

const TONE_BAR: Record<WorkInsightBar['tone'], string> = {
  neutral: 'bg-neutral-400',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-error',
  success: 'bg-success',
  progress: 'bg-progress',
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="border border-neutral-300 bg-white px-4 py-3">
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography as="p" weight="medium" size="lg" className={warn && value > 0 ? 'text-error' : undefined}>
        {value}
      </Typography>
    </div>
  )
}

function BarChart({ title, rows }: { title: string; rows: WorkInsightBar[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <section className="border border-neutral-300 bg-white p-4">
      <Typography weight="medium" size="sm" className="mb-3">
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="small" tone="muted">
          No data yet
        </Typography>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <Typography variant="small">{row.label}</Typography>
                <Typography variant="small" tone="muted">
                  {row.count}
                </Typography>
              </div>
              <div className="h-2 w-full bg-neutral-100">
                <div
                  className={cn('h-2', TONE_BAR[row.tone])}
                  style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function WorkItemsChartView({ insights }: { insights: WorkItemsInsights }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total" value={insights.total} />
        <StatCard label="Overdue" value={insights.overdue} warn />
        <StatCard label="Blocked" value={insights.blocked} warn />
        <StatCard label="Unassigned" value={insights.unassigned} />
        <StatCard label="Closed" value={insights.done} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart title="By status" rows={insights.byStatus} />
        <BarChart title="By priority" rows={insights.byPriority} />
      </div>
      <BarChart title="By phase" rows={insights.byPhase} />
    </div>
  )
}
