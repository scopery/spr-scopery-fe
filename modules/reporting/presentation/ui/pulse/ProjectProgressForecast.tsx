'use client'

import { Stack, Typography } from '@/shared/ui'
import type { ProgressForecastInsight } from '../../../domain/model/project-pulse'
import { formatSignedDays } from '../../view-models/insight-field'
import { PulseTextAction, PulseWidget } from './PulseWidget'

export function ProjectProgressForecast({
  progress,
  scheduleHref,
}: {
  progress: ProgressForecastInsight
  scheduleHref: string
}) {
  if (!progress.available) return null

  return (
    <PulseWidget
      title="Progress and forecast"
      footer={<PulseTextAction href={scheduleHref}>Open schedule</PulseTextAction>}
    >
      <Stack direction="vertical" spacing="md">
        <Typography variant="small" className="text-neutral-700">
          {progress.summary}
        </Typography>
        <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
          <Metric
            label="Planned by today"
            value={
              progress.plannedPercent != null ? `${Math.round(progress.plannedPercent)}%` : '—'
            }
          />
          <Metric
            label="Actually completed"
            value={
              progress.completedPercent != null
                ? `${Math.round(progress.completedPercent)}%`
                : '—'
            }
          />
          <Metric
            label="Variance"
            value={
              progress.variancePercent != null
                ? `${progress.variancePercent >= 0 ? '+' : ''}${Math.round(progress.variancePercent)}%`
                : '—'
            }
          />
        </div>
        <div className="space-y-sm bg-neutral-50 p-sm">
          <BarRow
            label="Baseline"
            value={progress.baselineFinish ?? '—'}
            widthClass="w-3/4 bg-neutral-400"
          />
          <BarRow
            label="Current"
            value={progress.forecastFinish ?? '—'}
            widthClass="w-full bg-primary"
          />
          {progress.scheduleVarianceDays != null ? (
            <Typography variant="caption" className="font-medium text-neutral-700">
              {formatSignedDays(progress.scheduleVarianceDays)}
            </Typography>
          ) : null}
        </div>
      </Stack>
    </PulseWidget>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography variant="h4" className="text-neutral-950">
        {value}
      </Typography>
    </div>
  )
}

function BarRow({
  label,
  value,
  widthClass,
}: {
  label: string
  value: string
  widthClass: string
}) {
  return (
    <div className="space-y-xs">
      <div className="flex justify-between gap-sm">
        <Typography variant="caption" className="font-medium text-neutral-700">
          {label}
        </Typography>
        <Typography variant="caption" className="text-neutral-800">
          {value}
        </Typography>
      </div>
      <div className="h-2 w-full overflow-hidden bg-neutral-200">
        <div className={`h-2 ${widthClass}`} />
      </div>
    </div>
  )
}
