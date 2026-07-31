'use client'

import { Card, Select, Stack, Typography } from '@/shared/ui'
import type { PulseFilterOption, PulsePeriodFilter } from '../../../domain/model/project-pulse'

export function DashboardFilters({
  period,
  onPeriodChange,
  phase,
  onPhaseChange,
  phaseOptions,
  baseline,
  onBaselineChange,
  baselineOptions,
}: {
  period: PulsePeriodFilter
  onPeriodChange: (value: PulsePeriodFilter) => void
  phase: string
  onPhaseChange: (value: string) => void
  phaseOptions: PulseFilterOption[]
  baseline: string
  onBaselineChange: (value: string) => void
  baselineOptions: PulseFilterOption[]
}) {
  return (
    <Card className="p-md">
      <Typography variant="overline" tone="muted" className="mb-sm">
        Dashboard filters
      </Typography>
      <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
        <Stack direction="vertical" spacing="xs">
          <Typography variant="caption" tone="muted">
            Period
          </Typography>
          <Select
            size="sm"
            value={period}
            onValueChange={(value: string) => onPeriodChange(value as PulsePeriodFilter)}
            options={[
              { value: 'last_visit', label: 'Since last visit' },
              { value: 'yesterday', label: 'Since yesterday' },
              { value: 'last_7_days', label: 'Last 7 days' },
              { value: 'since_baseline', label: 'Since current baseline' },
            ]}
          />
        </Stack>
        <Stack direction="vertical" spacing="xs">
          <Typography variant="caption" tone="muted">
            Phase
          </Typography>
          <Select size="sm" value={phase} onValueChange={onPhaseChange} options={phaseOptions} />
        </Stack>
        <Stack direction="vertical" spacing="xs">
          <Typography variant="caption" tone="muted">
            Baseline
          </Typography>
          <Select
            size="sm"
            value={baseline}
            onValueChange={onBaselineChange}
            options={baselineOptions}
          />
        </Stack>
      </div>
    </Card>
  )
}
