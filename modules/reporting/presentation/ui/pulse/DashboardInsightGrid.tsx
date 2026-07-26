'use client'

import type { ReactNode } from 'react'
import { Typography } from '@/shared/ui'
import { FinancePermissionState } from '../../../domain/enums/project-health.enum'
import type {
  CapacityInsight,
  FinancialOutlookInsight,
  QualityCoverageInsight,
  RiskIssueInsight,
  ScheduleMilestoneInsight,
  ScopeChangeInsight,
} from '../../../domain/model/project-pulse'
import { formatSignedDays } from '../../view-models/insight-field'
import { PulseStatRows, PulseTextAction, PulseWidget } from './PulseWidget'

export function DashboardInsightGrid({
  schedule,
  capacity,
  scopeChange,
  quality,
  financials,
  risks,
  hrefs,
}: {
  schedule: ScheduleMilestoneInsight
  capacity: CapacityInsight
  scopeChange: ScopeChangeInsight
  quality: QualityCoverageInsight
  financials: FinancialOutlookInsight
  risks: RiskIssueInsight
  hrefs: {
    schedule: string
    resources: string
    changeRequests: string
    traceability: string
    financials: string
    raid: string
  }
}) {
  const cards: ReactNode[] = []

  if (schedule.available) {
    cards.push(
      <PulseWidget
        key="schedule"
        title="Schedule and milestones"
        footer={<PulseTextAction href={hrefs.schedule}>Open schedule</PulseTextAction>}
      >
        <Typography variant="small" className="mb-sm text-neutral-700">
          {[
            schedule.forecastFinish ? `Forecast ${schedule.forecastFinish}` : null,
            schedule.baselineFinish ? `Baseline ${schedule.baselineFinish}` : null,
            formatSignedDays(schedule.scheduleVarianceDays),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
        <PulseStatRows
          rows={schedule.rows.map((row) => ({ label: row.label, value: row.detail }))}
        />
      </PulseWidget>
    )
  }

  if (capacity.available) {
    cards.push(
      <PulseWidget
        key="capacity"
        title="Team capacity"
        footer={<PulseTextAction href={hrefs.resources}>Open workload</PulseTextAction>}
      >
        <Typography variant="small" className="mb-sm text-neutral-700">
          {capacity.summary}
        </Typography>
        <PulseStatRows
          rows={capacity.rows.map((row) => ({ label: row.label, value: row.detail }))}
        />
      </PulseWidget>
    )
  }

  if (scopeChange.available) {
    cards.push(
      <PulseWidget
        key="scope"
        title="Scope and change"
        footer={
          <PulseTextAction href={hrefs.changeRequests}>Review change requests</PulseTextAction>
        }
      >
        <PulseStatRows rows={scopeChange.rows} />
      </PulseWidget>
    )
  }

  if (quality.available) {
    cards.push(
      <PulseWidget
        key="quality"
        title="Quality and coverage"
        footer={<PulseTextAction href={hrefs.traceability}>Review coverage gaps</PulseTextAction>}
      >
        <Typography variant="small" className="mb-sm text-neutral-700">
          {quality.summary}
        </Typography>
        <PulseStatRows
          rows={[
            quality.coveragePercent != null
              ? {
                  label: 'Requirements covered',
                  value: `${Math.round(quality.coveragePercent)}%`,
                }
              : null,
            quality.missingTests != null
              ? { label: 'Missing tests', value: String(quality.missingTests) }
              : null,
            quality.failedResults != null
              ? { label: 'Failed results', value: String(quality.failedResults) }
              : null,
            quality.openDefects != null
              ? { label: 'Open defects', value: String(quality.openDefects) }
              : null,
          ].filter(Boolean) as Array<{ label: string; value: string }>}
        />
      </PulseWidget>
    )
  }

  if (financials.permission === FinancePermissionState.Allowed && financials.available) {
    cards.push(
      <PulseWidget
        key="finance"
        title="Financial outlook"
        footer={<PulseTextAction href={hrefs.financials}>Open financials</PulseTextAction>}
      >
        <PulseStatRows rows={financials.rows} />
      </PulseWidget>
    )
  } else if (financials.permission === FinancePermissionState.Masked) {
    cards.push(
      <PulseWidget key="finance-masked" title="Financial outlook">
        <Typography variant="small" tone="muted">
          {financials.reason ??
            "You don’t have permission to view project financials."}
        </Typography>
      </PulseWidget>
    )
  }

  if (risks.available) {
    cards.push(
      <PulseWidget
        key="risks"
        title="Risks and issues"
        footer={<PulseTextAction href={hrefs.raid}>Open RAID</PulseTextAction>}
      >
        <Typography variant="small" className="mb-sm text-neutral-700">
          {risks.summary}
        </Typography>
        <PulseStatRows
          rows={risks.topItems.map((item) => ({
            label: item.label,
            value: item.detail,
          }))}
        />
      </PulseWidget>
    )
  }

  if (cards.length === 0) return null

  return <div className="grid grid-cols-1 gap-md lg:grid-cols-2">{cards}</div>
}
