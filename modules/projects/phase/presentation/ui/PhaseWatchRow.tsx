'use client'

import Link from 'next/link'
import { Badge, Progress, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { PhaseWatchSignal } from '../../domain/enums/phase-watch.enum'
import type { PhaseWatchPhaseSummary, PhaseWatchProjectRow } from '../../domain/model/phase-watch'
import {
  formatPhaseWatchDate,
  phaseDisplayTitle,
  phaseWatchSignalLabel,
} from '../../domain/rules/phase-watch.rules'

function signalTone(signal: string): 'error' | 'warning' | 'info' | 'success' | 'neutral' {
  switch (signal) {
    case PhaseWatchSignal.HasBlockers:
      return 'error'
    case PhaseWatchSignal.StartingSoon:
    case PhaseWatchSignal.NoStartDate:
    case PhaseWatchSignal.UnassignedTasks:
      return 'warning'
    case PhaseWatchSignal.NoTasks:
      return 'info'
    case PhaseWatchSignal.OnTrack:
      return 'success'
    default:
      return 'neutral'
  }
}

export function PhaseSignalBadge({ signal }: { signal: string }) {
  return (
    <Badge variant="solid" tone={signalTone(signal)} className="rounded-none">
      {phaseWatchSignalLabel(signal as never)}
    </Badge>
  )
}

export function ActivePhaseBlock({
  phase,
  compact,
}: {
  phase: PhaseWatchPhaseSummary
  compact?: boolean
}) {
  return (
    <div className={cn(compact ? 'space-y-0.5' : 'space-y-1')}>
      <Typography size="sm" weight="medium" className="text-neutral-900">
        {phaseDisplayTitle(phase)}
      </Typography>
      <Typography variant="small" tone="muted">
        {phase.progressPercent == null ? 'No tasks' : `${phase.progressPercent}%`}
        {phase.plannedEndDate ? ` · Ends ${formatPhaseWatchDate(phase.plannedEndDate)}` : ''}
        {` · ${phase.statusLabel}`}
      </Typography>
      {phase.progressPercent != null && !compact ? (
        <Progress value={phase.progressPercent} size="sm" className="mt-1 max-w-[12rem]" />
      ) : null}
    </div>
  )
}

export function NextPhaseBlock({
  phase,
  followUpLabels,
  compact,
}: {
  phase: PhaseWatchPhaseSummary | null
  followUpLabels?: string[]
  compact?: boolean
}) {
  if (!phase) {
    return (
      <Typography variant="small" tone="muted">
        No next phase
      </Typography>
    )
  }
  return (
    <div className={cn(compact ? 'space-y-0.5' : 'space-y-1')}>
      <Typography size="sm" weight="medium" className="text-neutral-900">
        {phaseDisplayTitle(phase)}
      </Typography>
      <Typography variant="small" tone="muted">
        {phase.plannedStartDate
          ? `Starts ${formatPhaseWatchDate(phase.plannedStartDate)}`
          : 'Start date not scheduled'}
      </Typography>
      {followUpLabels && followUpLabels.length > 0 ? (
        <Typography variant="small" className="text-neutral-700">
          {followUpLabels.join(' · ')}
        </Typography>
      ) : null}
    </div>
  )
}

export function PhaseWatchProjectRowView({
  row,
  workspaceId,
  compact,
}: {
  row: PhaseWatchProjectRow
  workspaceId: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'grid gap-3 border-b border-neutral-100 py-3 last:border-0',
        compact
          ? 'grid-cols-1'
          : 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_auto]'
      )}
    >
      <div className="min-w-0">
        <Link
          href={ROUTES.workspace.projectOverview(workspaceId, row.projectId)}
          className="hover:underline"
        >
          <Typography size="sm" weight="semibold" className="text-neutral-900">
            {row.projectName}
          </Typography>
        </Link>
        {row.projectCode ? (
          <Typography variant="small" tone="muted" className="font-mono">
            {row.projectCode}
          </Typography>
        ) : null}
      </div>

      <div className="min-w-0 space-y-2">
        {!compact ? (
          <Typography variant="small" tone="muted" className="lg:hidden">
            Current
          </Typography>
        ) : null}
        {row.activePhases.length === 0 ? (
          <Typography variant="small" tone="muted">
            No current phase
          </Typography>
        ) : (
          row.activePhases.map((p) => <ActivePhaseBlock key={p.phaseId} phase={p} compact={compact} />)
        )}
        {row.activePhases.length > 1 ? (
          <Typography variant="small" tone="muted">
            Current phases · {row.activePhases.length}
          </Typography>
        ) : null}
      </div>

      <div className="min-w-0">
        {!compact ? (
          <Typography variant="small" tone="muted" className="lg:hidden">
            Next
          </Typography>
        ) : null}
        <NextPhaseBlock
          phase={row.nextPhase}
          followUpLabels={row.followUpLabels.filter((l) => l !== 'Ready')}
          compact={compact}
        />
      </div>

      <div className="flex items-start lg:justify-end">
        <PhaseSignalBadge signal={row.primarySignal} />
      </div>
    </div>
  )
}
