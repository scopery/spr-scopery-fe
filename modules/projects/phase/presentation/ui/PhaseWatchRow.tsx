'use client'

import Link from 'next/link'
import { Badge, DataTable, Progress, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { PhaseWatchSignal } from '../../domain/enums/phase-watch.enum'
import type { PhaseWatchPhaseSummary, PhaseWatchProjectRow } from '../../domain/model/phase-watch'
import {
  formatDaysRemaining,
  formatPhaseWatchDate,
  isPhaseEndingSoon,
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function signalTone(signal: string): 'error' | 'warning' | 'info' | 'success' | 'neutral' {
  switch (signal) {
    case PhaseWatchSignal.HasBlockers:
      return 'error'
    case PhaseWatchSignal.EndingSoon:
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
    <Badge variant="solid" tone={signalTone(signal)} className="whitespace-nowrap rounded-none">
      {phaseWatchSignalLabel(signal as never)}
    </Badge>
  )
}

export function ActivePhaseBlock({
  phase,
  compact,
  daysLeftLabel,
}: {
  phase: PhaseWatchPhaseSummary
  compact?: boolean
  daysLeftLabel?: string | null
}) {
  const title = phaseDisplayTitle(phase)
  const detail = [
    phase.progressPercent == null ? 'No tasks' : `${phase.progressPercent}%`,
    phase.plannedEndDate ? `Ends ${formatPhaseWatchDate(phase.plannedEndDate)}` : null,
    daysLeftLabel,
    phase.statusLabel,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className={cn('min-w-0', compact ? 'space-y-0.5' : 'space-y-1')}>
      <Typography
        as="p"
        size="sm"
        weight="medium"
        className="truncate text-neutral-900"
        title={title}
      >
        {title}
      </Typography>
      <Typography variant="small" className="truncate text-neutral-600" title={detail}>
        {detail}
      </Typography>
      {phase.progressPercent != null && !compact ? (
        <Progress
          value={phase.progressPercent}
          size="sm"
          className="mt-1 max-w-[12rem] [&_[role=progressbar]]:rounded-none"
        />
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
  daysLeftLabel,
}: {
  phase: PhaseWatchPhaseSummary | null
  followUpLabels?: string[]
  compact?: boolean
  startingSoon?: boolean
  noStartDate?: boolean
  daysLeftLabel?: string | null
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
  const schedule = [
    phase.plannedStartDate
      ? `Starts ${formatPhaseWatchDate(phase.plannedStartDate)}`
      : 'Start date not scheduled',
    daysLeftLabel,
  ]
    .filter(Boolean)
    .join(' · ')
  const followUp = followUpLabels?.join(' · ') ?? ''
  return (
    <div
      className={cn(
        'min-w-0',
        compact ? 'space-y-0.5' : 'space-y-1',
        alert && 'rounded-none border border-orange-200/70 bg-orange-50/80 px-2 py-1.5'
      )}
    >
      <Typography
        as="p"
        size="sm"
        weight="medium"
        className="truncate text-neutral-900"
        title={title}
      >
        {title}
      </Typography>
      <Typography
        variant="small"
        className={cn('truncate', alert ? 'font-medium text-red-700' : 'text-neutral-600')}
        title={schedule}
      >
        {schedule}
      </Typography>
      {followUp ? (
        <Typography variant="small" className="truncate text-neutral-700" title={followUp}>
          {followUp}
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
        <th className="pb-2 text-right align-bottom">
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
  const todayIso = todayIsoDate()

  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="py-3 pr-3 align-top">
        <div className="min-w-0">
          <Link
            href={ROUTES.workspace.projectOverview(workspaceId, row.projectId)}
            className="block hover:underline"
          >
            <Typography
              as="p"
              size="sm"
              weight="semibold"
              className="truncate text-neutral-900"
              title={row.projectName}
            >
              {row.projectName}
            </Typography>
          </Link>
          {row.projectCode ? (
            <Typography
              as="p"
              variant="small"
              tone="muted"
              className="truncate font-normal"
              title={row.projectCode}
            >
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
            row.activePhases.map((p) => {
              const endingSoon = isPhaseEndingSoon(p.plannedEndDate, todayIso)
              return (
                <ActivePhaseBlock
                  key={p.phaseId}
                  phase={p}
                  compact={compact}
                  daysLeftLabel={
                    endingSoon && p.plannedEndDate
                      ? formatDaysRemaining(p.plannedEndDate, todayIso)
                      : null
                  }
                />
              )
            })
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
            daysLeftLabel={
              row.signals.includes(PhaseWatchSignal.StartingSoon) && row.nextPhase?.plannedStartDate
                ? formatDaysRemaining(row.nextPhase.plannedStartDate, todayIso)
                : null
            }
          />
        </div>
      </td>

      <td className="py-3 text-right align-top">
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
  const todayIso = todayIsoDate()
  return (
    <DataTable
      ariaLabel="Project phase watch"
      rows={rows}
      rowKey={(row) => row.projectId}
      columns={[
        {
          id: 'project',
          header: 'Project',
          width: '22%',
          kind: 'code',
          cell: (row) => (
            <div className="min-w-0">
              <Link
                href={ROUTES.workspace.projectOverview(workspaceId, row.projectId)}
                className="block hover:underline"
              >
                <Typography
                  as="p"
                  size="sm"
                  weight="semibold"
                  className="truncate text-neutral-900"
                  title={row.projectName}
                >
                  {row.projectName}
                </Typography>
              </Link>
              {row.projectCode ? (
                <Typography
                  as="p"
                  variant="small"
                  tone="muted"
                  className="truncate font-normal"
                  title={row.projectCode}
                >
                  {row.projectCode}
                </Typography>
              ) : null}
            </div>
          ),
        },
        {
          id: 'current',
          header: 'Current phase',
          width: '32%',
          cell: (row) => (
            <div className="min-w-0 space-y-2">
              {row.activePhases.length === 0 ? (
                <Typography variant="small" tone="muted">
                  No current phase
                </Typography>
              ) : (
                row.activePhases.map((phase) => {
                  const endingSoon = isPhaseEndingSoon(phase.plannedEndDate, todayIso)
                  return (
                    <ActivePhaseBlock
                      key={phase.phaseId}
                      phase={phase}
                      compact={compact}
                      daysLeftLabel={
                        endingSoon && phase.plannedEndDate
                          ? formatDaysRemaining(phase.plannedEndDate, todayIso)
                          : null
                      }
                    />
                  )
                })
              )}
              {row.activePhases.length > 1 ? (
                <Typography variant="small" tone="muted">
                  Current phases · {row.activePhases.length}
                </Typography>
              ) : null}
            </div>
          ),
        },
        {
          id: 'next',
          header: 'Next phase',
          width: '30%',
          cell: (row) => (
            <NextPhaseBlock
              phase={row.nextPhase}
              followUpLabels={row.followUpLabels.filter((label) => label !== 'Ready')}
              compact={compact}
              startingSoon={row.signals.includes(PhaseWatchSignal.StartingSoon)}
              noStartDate={row.signals.includes(PhaseWatchSignal.NoStartDate)}
              daysLeftLabel={
                row.signals.includes(PhaseWatchSignal.StartingSoon) &&
                row.nextPhase?.plannedStartDate
                  ? formatDaysRemaining(row.nextPhase.plannedStartDate, todayIso)
                  : null
              }
            />
          ),
        },
        {
          id: 'followUp',
          header: followUpLabel ?? 'Follow-up',
          width: '16%',
          align: 'right',
          cell: (row) => (
            <div className="inline-flex justify-end">
              <PhaseSignalBadge signal={row.primarySignal} />
            </div>
          ),
        },
      ]}
    />
  )
}

/** @deprecated Prefer PhaseWatchTable / PhaseWatchTableRow */
export function PhaseWatchProjectRowView(props: {
  row: PhaseWatchProjectRow
  workspaceId: string
  compact?: boolean
}) {
  return (
    <PhaseWatchTable rows={[props.row]} workspaceId={props.workspaceId} compact={props.compact} />
  )
}
