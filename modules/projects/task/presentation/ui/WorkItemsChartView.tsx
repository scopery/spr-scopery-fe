'use client'

import { Typography } from '@/shared/ui'
import type { WorkItemsInsights } from '../../domain/rules/work-items-insights.rules'
import { WorkItemsStackedStatusChart } from './work-items-charts/WorkItemsStackedStatusChart'
import { WorkItemsStatusDonut } from './work-items-charts/WorkItemsStatusDonut'

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
        <WorkItemsStatusDonut total={insights.total} slices={insights.byStatus} />
        <WorkItemsStackedStatusChart
          title="Tasks by member and status"
          rows={insights.byMember}
        />
      </div>
      <WorkItemsStackedStatusChart
        title="Tasks by phase and status"
        rows={insights.byPhase}
      />
      <WorkItemsStackedStatusChart
        title="Tasks by priority and status"
        rows={insights.byPriority}
        layout="horizontal"
      />
    </div>
  )
}
