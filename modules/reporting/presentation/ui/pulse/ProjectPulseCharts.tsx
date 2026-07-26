'use client'

import { Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type {
  BaselineOverlayInsight,
  BurnupInsight,
  CapacityHeatmapInsight,
} from '../../../domain/model/project-pulse'
import { utilizationCellClass } from '../../view-models/project-pulse-p1.vm'
import { PulseTextAction, PulseWidget } from './PulseWidget'

export function CapacityHeatmapWidget({
  insight,
  href,
}: {
  insight: CapacityHeatmapInsight
  href: string
}) {
  if (!insight.available) return null
  return (
    <PulseWidget
      title="Team capacity heatmap"
      footer={<PulseTextAction href={href}>Open workload</PulseTextAction>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="border border-neutral-200 bg-neutral-50 px-sm py-xs">
                <Typography variant="caption" tone="muted">
                  Team
                </Typography>
              </th>
              {insight.weeks.map((week) => (
                <th
                  key={week}
                  className="border border-neutral-200 bg-neutral-50 px-sm py-xs text-center"
                >
                  <Typography variant="caption" tone="muted">
                    {week}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {insight.rows.map((row) => (
              <tr key={row.label}>
                <td className="border border-neutral-200 px-sm py-xs">
                  <Typography variant="small" className="font-medium">
                    {row.label}
                  </Typography>
                </td>
                {row.cells.map((cell) => (
                  <td
                    key={`${row.label}-${cell.week}`}
                    className={cn(
                      'border border-neutral-200 px-sm py-xs text-center text-xs font-semibold',
                      utilizationCellClass(cell.utilizationPercent)
                    )}
                  >
                    {cell.utilizationPercent != null
                      ? `${Math.round(cell.utilizationPercent)}%`
                      : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PulseWidget>
  )
}

export function BurnupChartWidget({ insight }: { insight: BurnupInsight }) {
  if (!insight.available) return null
  return (
    <PulseWidget title="Cumulative scope">
      <Stack direction="vertical" spacing="md">
        <Typography variant="small" className="text-neutral-700">
          {insight.summary}
        </Typography>
        <div className="flex h-40 items-end gap-sm bg-neutral-50 px-sm py-sm">
          {insight.points.map((point) => {
            const planned = point.plannedPercent ?? 0
            const completed = point.completedPercent ?? 0
            return (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-xs">
                <div className="relative flex h-28 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-2 bg-neutral-400"
                    style={{ height: `${Math.max(4, planned)}%` }}
                    title={`Planned ${planned}%`}
                  />
                  <div
                    className="w-2 bg-primary"
                    style={{ height: `${Math.max(4, completed)}%` }}
                    title={`Completed ${completed}%`}
                  />
                </div>
                <Typography variant="caption" tone="muted">
                  {point.label}
                </Typography>
              </div>
            )
          })}
        </div>
        <div className="flex gap-md">
          <Typography variant="caption" className="text-neutral-600">
            <span className="mr-xs inline-block h-2 w-3 bg-neutral-400" /> Planned
          </Typography>
          <Typography variant="caption" className="text-neutral-600">
            <span className="mr-xs inline-block h-2 w-3 bg-primary" /> Current
          </Typography>
        </div>
      </Stack>
    </PulseWidget>
  )
}

export function BaselineOverlayWidget({
  insight,
  href,
}: {
  insight: BaselineOverlayInsight
  href: string
}) {
  if (!insight.available) return null
  return (
    <PulseWidget
      title="Baseline vs current"
      footer={<PulseTextAction href={href}>Open schedule</PulseTextAction>}
    >
      <Stack direction="vertical" spacing="md">
        {insight.baselineName ? (
          <Typography variant="caption" tone="muted">
            Compared to {insight.baselineName}
          </Typography>
        ) : null}
        {insight.bars.map((bar) => (
          <div key={bar.id} className="space-y-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-sm">
              <Typography variant="small" className="font-semibold text-neutral-900">
                {bar.label}
              </Typography>
              {bar.deltaLabel ? (
                <Typography
                  variant="caption"
                  className={
                    bar.tone === 'delayed'
                      ? 'text-warning'
                      : bar.tone === 'improved'
                        ? 'text-success'
                        : 'text-neutral-600'
                  }
                >
                  {bar.deltaLabel}
                </Typography>
              ) : null}
            </div>
            <OverlayTrack
              label="Baseline"
              value={bar.baselineLabel}
              offset={bar.baselineOffsetPercent}
              width={bar.baselineWidthPercent}
              barClassName="bg-neutral-400"
            />
            <OverlayTrack
              label="Current"
              value={bar.currentLabel}
              offset={bar.currentOffsetPercent}
              width={bar.currentWidthPercent}
              barClassName={
                bar.tone === 'delayed'
                  ? 'bg-warning'
                  : bar.tone === 'improved'
                    ? 'bg-success'
                    : bar.tone === 'new'
                      ? 'border border-dashed border-primary bg-primary/30'
                      : 'bg-primary'
              }
            />
          </div>
        ))}
      </Stack>
    </PulseWidget>
  )
}

function OverlayTrack({
  label,
  value,
  offset,
  width,
  barClassName,
}: {
  label: string
  value: string
  offset: number
  width: number
  barClassName: string
}) {
  return (
    <div className="space-y-xs">
      <div className="flex justify-between gap-sm">
        <Typography variant="caption" tone="muted">
          {label}
        </Typography>
        <Typography variant="caption">{value}</Typography>
      </div>
      <div className="relative h-3 w-full bg-neutral-100">
        <div
          className={cn('absolute top-0 h-3', barClassName)}
          style={{
            left: `${Math.max(0, Math.min(80, offset))}%`,
            width: `${Math.max(8, Math.min(100 - offset, width))}%`,
          }}
        />
      </div>
    </div>
  )
}
