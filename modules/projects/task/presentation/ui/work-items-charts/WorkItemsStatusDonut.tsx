'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Typography } from '@/shared/ui'
import type { WorkInsightBar } from '../../../domain/rules/work-items-insights.rules'
import { ChartPanel } from './ChartPanel'
import { statusFill } from './status-fill'

export function WorkItemsStatusDonut({
  total,
  slices,
}: {
  total: number
  slices: WorkInsightBar[]
}) {
  return (
    <ChartPanel title="Tasks by status" empty={slices.length === 0}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative h-56 w-full max-w-[16rem] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="count"
                nameKey="label"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                stroke="none"
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={statusFill(slice.key)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [String(value ?? 0), 'Tasks']}
                contentStyle={{
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <Typography as="p" weight="medium" size="lg">
              {total}
            </Typography>
            <Typography variant="caption" tone="muted">
              tasks
            </Typography>
          </div>
        </div>
        <ul className="w-full space-y-2">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0"
                  style={{ backgroundColor: statusFill(slice.key) }}
                />
                <Typography variant="small">{slice.label}</Typography>
              </span>
              <Typography variant="small" tone="muted">
                {slice.count}
              </Typography>
            </li>
          ))}
        </ul>
      </div>
    </ChartPanel>
  )
}
