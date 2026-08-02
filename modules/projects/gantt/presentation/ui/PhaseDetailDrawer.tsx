'use client'

import { Badge, Button, DetailDrawer, Stack, Typography } from '@/shared/ui'
import type { TimelineFlatRow } from '../../domain/model/timeline'
import {
  formatTimelineCompactRange,
  formatTimelineShortDate,
} from '../../domain/rules/phase-display.rules'
import { phaseHealthLabel } from '../../domain/rules/phase-row-summary.rules'

type Props = {
  open: boolean
  onClose: () => void
  phase: TimelineFlatRow | null
  nextPhase: TimelineFlatRow | null
  onFocusPhase: () => void
  onCollapseOthers: () => void
  onAddTask: () => void
  onFitDates: () => void
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-md border-b border-neutral-100 py-sm">
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography variant="caption" className="text-right font-medium text-neutral-900">
        {value}
      </Typography>
    </div>
  )
}

export function PhaseDetailDrawer({
  open,
  onClose,
  phase,
  nextPhase,
  onFocusPhase,
  onCollapseOthers,
  onAddTask,
  onFitDates,
}: Props) {
  if (!phase) {
    return (
      <DetailDrawer open={open} onClose={onClose} title="Phase" size="md">
        <Typography variant="caption" tone="muted">
          Select a phase to view details.
        </Typography>
      </DetailDrawer>
    )
  }

  const summary = phase.phaseSummary
  const health = summary ? phaseHealthLabel(summary) : null
  const title =
    phase.phaseCode != null
      ? `${phase.phaseCode} · ${phase.displayPrimary}`
      : phase.displayPrimary

  return (
    <DetailDrawer open={open} onClose={onClose} title={title} size="md">
      <Stack direction="vertical" spacing="md">
        <div>
          <Typography as="h2" size="md" weight="medium">
            {phase.displayPrimary}
          </Typography>
          {phase.displaySecondary && (
            <Typography variant="caption" tone="muted" className="mt-xs block">
              {phase.displaySecondary}
            </Typography>
          )}
          {phase.phaseDescription && (
            <Typography variant="caption" className="mt-sm block text-neutral-700">
              {phase.phaseDescription}
            </Typography>
          )}
        </div>

        <div>
          <MetaRow label="Status" value={phase.status ?? '—'} />
          <MetaRow
            label="Progress"
            value={
              phase.progressPercent != null ? `${Math.round(phase.progressPercent)}%` : '—'
            }
          />
          <MetaRow label="Start" value={formatTimelineShortDate(phase.startDate)} />
          <MetaRow label="End" value={formatTimelineShortDate(phase.endDate)} />
          <MetaRow
            label="Window"
            value={formatTimelineCompactRange(phase.startDate, phase.endDate) || '—'}
          />
        </div>

        {summary && (
          <Stack direction="vertical" spacing="xs">
            <Typography variant="caption" weight="medium">
              Tasks
            </Typography>
            <Typography variant="caption" tone="muted">
              {summary.taskCount} total · {summary.completedCount} done ·{' '}
              {summary.activeCount} active · {summary.unscheduledCount} unscheduled
              {summary.blockedCount > 0 ? ` · ${summary.blockedCount} blocked` : ''}
            </Typography>
          </Stack>
        )}

        <Stack direction="vertical" spacing="xs">
          <Typography variant="caption" weight="medium">
            Schedule health
          </Typography>
          {health ? (
            <Badge tone="error" size="sm">
              {health}
              {summary && summary.atRiskCount > 0
                ? ` · ${summary.atRiskCount} task${summary.atRiskCount === 1 ? '' : 's'} at risk`
                : ''}
            </Badge>
          ) : (
            <Badge tone="success" size="sm">
              On track
            </Badge>
          )}
        </Stack>

        {nextPhase && (
          <Stack direction="vertical" spacing="xs">
            <Typography variant="caption" weight="medium">
              Next phase
            </Typography>
            <Typography variant="caption">{nextPhase.displayPrimary}</Typography>
            {nextPhase.startDate && (
              <Typography variant="caption" tone="muted">
                Starts {formatTimelineShortDate(nextPhase.startDate)}
              </Typography>
            )}
          </Stack>
        )}

        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          <Button variant="primary" size="sm" onClick={onFocusPhase}>
            Focus Phase
          </Button>
          <Button variant="outline" size="sm" onClick={onFitDates}>
            Adjust / Fit dates
          </Button>
          <Button variant="outline" size="sm" onClick={onAddTask}>
            Add Task
          </Button>
          <Button variant="ghost" size="sm" onClick={onCollapseOthers}>
            Collapse Other Phases
          </Button>
        </Stack>
      </Stack>
    </DetailDrawer>
  )
}
