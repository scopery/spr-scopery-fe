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

/** Shared column widths — keeps header + body aligned. */
export const PHASE_WATCH_COLGROUP = (
  <colgroup>
    <col className="w-[22%]" />
    <col className="w-[32%]" />
    <col className="w-[30%]" />
    <col className="w-[16%]" />
  </colgroup>
)

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
    <Badge variant="solid" tone={signalTone(signal)} className="rounded-none whitespace-nowrap">
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
  const title = phaseDisplayTitle(phase)
  return (
    <div className={cn('min-w-0', compact ? 'space-y-0.5' : 'space-y-1')}>
      <Typography as="p" size="sm" weight="medium" className="break-words text-neutral-900">
        {title}
      </Typography>
      <Typography variant="small" tone="muted" className="break-words">
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
  startingSoon,
  noStartDate,
}: {
  phase: PhaseWatchPhaseSummary | null
  followUpLabels?: string[]
  compact?: boolean
  startingSoon?: boolean
  noStartDate?: boolean
}) {
  if (!phase) {
    return (
      <Typography variant="small" tone="muted">
        No next phase
      </Typography>
    )
  }
  const title = phaseDisplayTitle(phase)
  const alert = Boolean(startingSoon || noStartDate)
  return (
    <div
      className={cn(
        'min-w-0',
        compact ? 'space-y-0.5' : 'space-y-1',
        alert && 'rounded-none border border-orange-200/70 bg-orange-50/80 px-2 py-1.5'
      )}
    >
      <Typography as="p" size="sm" weight="medium" className="break-words text-neutral-900">
        {title}
      </Typography>
      <Typography
        variant="small"
        className={cn('break-words', alert ? 'font-medium text-red-700' : 'text-neutral-600')}
      >
        {phase.plannedStartDate
          ? `Starts ${formatPhaseWatchDate(phase.plannedStartDate)}`
          : 'Start date not scheduled'}
        {startingSoon ? ' · Within 7 days' : ''}
      </Typography>
      {followUpLabels && followUpLabels.length > 0 ? (
        <Typography variant="small" className="break-words text-neutral-700">
          {followUpLabels.join(' · ')}
        </Typography>
      ) : null}
    </div>
  )
}

export function PhaseWatchTableHeader({ followUpLabel = 'Follow-up' }: { followUpLabel?: string }) {
  return (
    <thead>
      <tr className="border-b border-neutral-200 text-left">
        <th className="pb-2 pr-3 align-bottom">
          <Typography variant="small" tone="muted" weight="medium">
            Project
          </Typography>
        </th>
        <th className="pb-2 pr-3 align-bottom">
          <Typography variant="small" tone="muted" weight="medium">
            Current phase
          </Typography>
        </th>
        <th className="pb-2 pr-3 align-bottom">
          <Typography variant="small" tone="muted" weight="medium">
            Next phase
          </Typography>
        </th>
        <th className="pb-2 align-bottom text-right">
          <Typography variant="small" tone="muted" weight="medium">
            {followUpLabel}
          </Typography>
        </th>
      </tr>
    </thead>
  )
}

export function PhaseWatchTableRow({
  row,
  workspaceId,
  compact,
}: {
  row: PhaseWatchProjectRow
  workspaceId: string
  compact?: boolean
}) {
  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="py-3 pr-3 align-top">
        <div className="min-w-0">
          <Link
            href={ROUTES.workspace.projectOverview(workspaceId, row.projectId)}
            className="block hover:underline"
          >
            <Typography as="p" size="sm" weight="semibold" className="break-words text-neutral-900">
              {row.projectName}
            </Typography>
          </Link>
          {row.projectCode ? (
            <Typography as="p" variant="small" tone="muted" className="break-all font-mono">
              {row.projectCode}
            </Typography>
          ) : null}
        </div>
      </td>

      <td className="py-3 pr-3 align-top">
        <div className="min-w-0 space-y-2">
          {row.activePhases.length === 0 ? (
            <Typography variant="small" tone="muted">
              No current phase
            </Typography>
          ) : (
            row.activePhases.map((p) => (
              <ActivePhaseBlock key={p.phaseId} phase={p} compact={compact} />
            ))
          )}
          {row.activePhases.length > 1 ? (
            <Typography variant="small" tone="muted">
              Current phases · {row.activePhases.length}
            </Typography>
          ) : null}
        </div>
      </td>

      <td className="py-3 pr-3 align-top">
        <div className="min-w-0">
          <NextPhaseBlock
            phase={row.nextPhase}
            followUpLabels={row.followUpLabels.filter((l) => l !== 'Ready')}
            compact={compact}
            startingSoon={row.signals.includes(PhaseWatchSignal.StartingSoon)}
            noStartDate={row.signals.includes(PhaseWatchSignal.NoStartDate)}
          />
        </div>
      </td>

      <td className="py-3 align-top text-right">
        <div className="inline-flex justify-end">
          <PhaseSignalBadge signal={row.primarySignal} />
        </div>
      </td>
    </tr>
  )
}

export function PhaseWatchTable({
  rows,
  workspaceId,
  followUpLabel,
  compact,
}: {
  rows: PhaseWatchProjectRow[]
  workspaceId: string
  followUpLabel?: string
  compact?: boolean
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        {PHASE_WATCH_COLGROUP}
        <PhaseWatchTableHeader followUpLabel={followUpLabel} />
        <tbody>
          {rows.map((row) => (
            <PhaseWatchTableRow
              key={row.projectId}
              row={row}
              workspaceId={workspaceId}
              compact={compact}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** @deprecated Prefer PhaseWatchTable / PhaseWatchTableRow */
export function PhaseWatchProjectRowView(props: {
  row: PhaseWatchProjectRow
  workspaceId: string
  compact?: boolean
}) {
  return (
    <table className="w-full table-fixed border-collapse">
      {PHASE_WATCH_COLGROUP}
      <tbody>
        <PhaseWatchTableRow {...props} />
      </tbody>
    </table>
  )
}
