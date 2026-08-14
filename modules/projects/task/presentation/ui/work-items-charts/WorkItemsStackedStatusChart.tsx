'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Typography } from '@/shared/ui'
import type { WorkInsightStackRow } from '../../../domain/rules/work-items-insights.rules'
import { ChartPanel } from './ChartPanel'
import { stackedStatusKeys, statusFill, statusLegend, toStackedChartRows } from './status-fill'

export function WorkItemsStackedStatusChart({
  title,
  rows,
  layout = 'vertical',
}: {
  title: string
  rows: WorkInsightStackRow[]
  layout?: 'vertical' | 'horizontal'
}) {
  const statusKeys = stackedStatusKeys(rows)
  const data = toStackedChartRows(rows, statusKeys)
  const legend = statusLegend(statusKeys)
  const isVertical = layout === 'vertical'
  const height = isVertical ? Math.max(240, rows.length * 36 + 48) : 280

  return (
    <ChartPanel title={title} empty={rows.length === 0}>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {legend.map((item) => (
          <span key={item.status} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2.5 shrink-0" style={{ backgroundColor: item.fill }} />
            <Typography variant="caption" tone="muted">
              {item.label}
            </Typography>
          </span>
        ))}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={isVertical ? 'vertical' : 'horizontal'}
            margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              stroke="var(--color-neutral-200)"
              strokeDasharray="3 3"
              horizontal={!isVertical}
              vertical={isVertical}
            />
            {isVertical ? (
              <>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-neutral-600)' }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={112}
                  tick={{ fontSize: 11, fill: 'var(--color-neutral-800)' }}
                />
              </>
            ) : (
              <>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-neutral-800)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-neutral-600)' }} />
              </>
            )}
            <Tooltip
              formatter={(value, name) => [String(value ?? 0), legend.find((i) => i.status === name)?.label ?? String(name)]}
              contentStyle={{
                border: '1px solid var(--color-neutral-300)',
                borderRadius: 0,
                fontSize: 12,
              }}
            />
            {statusKeys.map((status) => (
              <Bar
                key={status}
                dataKey={status}
                stackId="status"
                fill={statusFill(status)}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}
