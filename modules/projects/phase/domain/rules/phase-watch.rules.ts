import { ProjectPhaseStatus, TaskStatus } from '../../../project/domain/enums/project.enum'
import type { ProjectPhase } from '../model/phase'
import type { ProjectTask } from '../../../task/domain/model/task'
import {
  PhaseWatchFollowUpKind,
  PhaseWatchSignal,
  type PhaseWatchFollowUpKind as FollowUpKind,
  type PhaseWatchSignal as Signal,
} from '../enums/phase-watch.enum'
import type { PhaseWatchPhaseSummary, PhaseWatchProjectRow } from '../model/phase-watch'

export function isPhaseTerminal(status: string): boolean {
  return status === ProjectPhaseStatus.Completed || status === ProjectPhaseStatus.Archived
}

/** Lifecycle ACTIVE — fallback when no calendar window matches today. */
export function isPhaseActiveByLifecycle(phase: ProjectPhase): boolean {
  if (isPhaseTerminal(phase.status)) return false
  if (phase.status === ProjectPhaseStatus.Active) return true
  if (phase.startedAt && !phase.completedAt && !phase.archivedAt) return true
  return false
}

/** @deprecated Prefer isPhaseActiveByLifecycle / isPhaseCurrentByDate */
export function isPhaseActive(phase: ProjectPhase): boolean {
  return isPhaseActiveByLifecycle(phase)
}

export function phaseWindowStart(phase: ProjectPhase): string | null {
  if (phase.plannedStartDate) return phase.plannedStartDate
  if (phase.startedAt) return phase.startedAt.slice(0, 10)
  return null
}

export function phaseWindowEnd(phase: ProjectPhase): string | null {
  if (phase.plannedEndDate) return phase.plannedEndDate
  if (phase.completedAt) return phase.completedAt.slice(0, 10)
  return null
}

/**
 * Current by calendar: today is inside [start, end] (inclusive).
 * Overlaps and same-day starts all qualify — none are hidden.
 * Open-ended (no end): only if still in-progress by lifecycle.
 */
export function isPhaseCurrentByDate(phase: ProjectPhase, todayIso: string): boolean {
  if (isPhaseTerminal(phase.status)) return false
  const start = phaseWindowStart(phase)
  if (!start || start > todayIso) return false
  const end = phaseWindowEnd(phase)
  if (end) return todayIso <= end
  return isPhaseActiveByLifecycle(phase)
}

export function phaseWatchStatusLabel(status: string): string {
  switch (status) {
    case ProjectPhaseStatus.Draft:
      return 'Not started'
    case ProjectPhaseStatus.Active:
      return 'In progress'
    case ProjectPhaseStatus.Completed:
      return 'Completed'
    case ProjectPhaseStatus.Archived:
      return 'Cancelled'
    default:
      return status
  }
}

export function sortPhasesByOrder(phases: ProjectPhase[]): ProjectPhase[] {
  return [...phases].sort((a, b) => {
    const byOrder = a.displayOrder - b.displayOrder
    if (byOrder !== 0) return byOrder
    const aStart = phaseWindowStart(a) ?? ''
    const bStart = phaseWindowStart(b) ?? ''
    return aStart.localeCompare(bStart) || a.name.localeCompare(b.name)
  })
}

/**
 * Current phases = calendar windows containing today (supports overlap).
 * Fallback: lifecycle ACTIVE when nothing matches by date.
 */
export function selectCurrentPhases(phases: ProjectPhase[], todayIso: string): ProjectPhase[] {
  const byDate = sortPhasesByOrder(phases.filter((p) => isPhaseCurrentByDate(p, todayIso)))
  if (byDate.length > 0) return byDate
  return sortPhasesByOrder(phases.filter(isPhaseActiveByLifecycle))
}

/** @deprecated Prefer selectCurrentPhases */
export function selectActivePhases(phases: ProjectPhase[], todayIso?: string): ProjectPhase[] {
  if (todayIso) return selectCurrentPhases(phases, todayIso)
  return sortPhasesByOrder(phases.filter(isPhaseActiveByLifecycle))
}

/**
 * Next phase = earliest upcoming window after today, excluding current phases.
 * Same-day start that is already current is not "next".
 */
export function selectNextPhase(phases: ProjectPhase[], todayIso: string): ProjectPhase | null {
  const currentIds = new Set(selectCurrentPhases(phases, todayIso).map((p) => p.id))
  const candidates = sortPhasesByOrder(
    phases.filter((p) => !isPhaseTerminal(p.status) && !currentIds.has(p.id))
  )
  if (candidates.length === 0) return null

  const upcoming = candidates
    .map((p) => ({ phase: p, start: phaseWindowStart(p) }))
    .filter((x): x is { phase: ProjectPhase; start: string } => !!x.start && x.start > todayIso)
    .sort(
      (a, b) =>
        a.start.localeCompare(b.start) ||
        a.phase.displayOrder - b.phase.displayOrder ||
        a.phase.name.localeCompare(b.phase.name)
    )

  if (upcoming.length > 0) return upcoming[0].phase

  // No dated upcoming — first undated candidate by order
  const undated = candidates.filter((p) => !phaseWindowStart(p))
  return undated[0] ?? null
}

function isTaskOpen(status: string): boolean {
  return (
    status !== TaskStatus.Completed &&
    status !== TaskStatus.Cancelled &&
    status !== TaskStatus.Archived
  )
}

export function buildPhaseSummary(
  phase: ProjectPhase,
  tasks: ProjectTask[]
): PhaseWatchPhaseSummary {
  const phaseTasks = tasks.filter((t) => t.projectPhaseId === phase.id)
  const completedTaskCount = phaseTasks.filter((t) => t.status === TaskStatus.Completed).length
  const blockedTaskCount = phaseTasks.filter((t) => t.status === TaskStatus.Blocked).length
  const unassignedTaskCount = phaseTasks.filter(
    (t) => isTaskOpen(t.status) && !t.inChargeUserId
  ).length
  const taskCount = phaseTasks.length
  const progressPercent =
    taskCount === 0 ? null : Math.round((completedTaskCount / taskCount) * 100)

  return {
    phaseId: phase.id,
    code: phase.code,
    name: phase.name,
    status: phase.status,
    statusLabel: phaseWatchStatusLabel(phase.status),
    displayOrder: phase.displayOrder,
    plannedStartDate: phase.plannedStartDate,
    plannedEndDate: phase.plannedEndDate,
    progressPercent,
    taskCount,
    completedTaskCount,
    blockedTaskCount,
    unassignedTaskCount,
  }
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function calendarDaysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`)
  const to = new Date(`${toIso}T12:00:00`)
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
}

/** Human label: Today / 1 day left / N days left */
export function formatDaysRemaining(targetIso: string, todayIso: string): string {
  const days = calendarDaysBetween(todayIso, targetIso)
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

/** End date is today or within the next 7 days (inclusive). */
export function isPhaseEndingSoon(
  plannedEndDate: string | null | undefined,
  todayIso: string
): boolean {
  if (!plannedEndDate) return false
  const soonEnd = addDaysIso(todayIso, 7)
  return plannedEndDate >= todayIso && plannedEndDate <= soonEnd
}

export function collectPhaseWatchSignals(
  activePhases: PhaseWatchPhaseSummary[],
  nextPhase: PhaseWatchPhaseSummary | null,
  todayIso: string
): Signal[] {
  const signals: Signal[] = []
  const blocked = activePhases.reduce((n, p) => n + p.blockedTaskCount, 0)
  if (blocked > 0) signals.push(PhaseWatchSignal.HasBlockers)

  if (activePhases.some((p) => isPhaseEndingSoon(p.plannedEndDate, todayIso))) {
    signals.push(PhaseWatchSignal.EndingSoon)
  }

  if (nextPhase) {
    if (!nextPhase.plannedStartDate) {
      signals.push(PhaseWatchSignal.NoStartDate)
    } else {
      const soonEnd = addDaysIso(todayIso, 7)
      if (nextPhase.plannedStartDate >= todayIso && nextPhase.plannedStartDate <= soonEnd) {
        signals.push(PhaseWatchSignal.StartingSoon)
      }
    }
    if (nextPhase.taskCount === 0) signals.push(PhaseWatchSignal.NoTasks)
    if (nextPhase.unassignedTaskCount > 0) signals.push(PhaseWatchSignal.UnassignedTasks)
  }

  if (activePhases.some((p) => p.taskCount === 0)) {
    if (!signals.includes(PhaseWatchSignal.NoTasks)) signals.push(PhaseWatchSignal.NoTasks)
  }

  if (signals.length === 0) signals.push(PhaseWatchSignal.OnTrack)
  return signals
}

const SIGNAL_PRIORITY: Signal[] = [
  PhaseWatchSignal.HasBlockers,
  PhaseWatchSignal.EndingSoon,
  PhaseWatchSignal.StartingSoon,
  PhaseWatchSignal.NoStartDate,
  PhaseWatchSignal.NoTasks,
  PhaseWatchSignal.UnassignedTasks,
  PhaseWatchSignal.OnTrack,
]

export function primaryPhaseWatchSignal(signals: Signal[]): Signal {
  for (const s of SIGNAL_PRIORITY) {
    if (signals.includes(s)) return s
  }
  return PhaseWatchSignal.OnTrack
}

export function phaseWatchSignalLabel(signal: Signal): string {
  switch (signal) {
    case PhaseWatchSignal.HasBlockers:
      return 'Has blockers'
    case PhaseWatchSignal.EndingSoon:
      return 'Ending soon'
    case PhaseWatchSignal.StartingSoon:
      return 'Starting soon'
    case PhaseWatchSignal.NoStartDate:
      return 'No start date'
    case PhaseWatchSignal.NoTasks:
      return 'No tasks'
    case PhaseWatchSignal.UnassignedTasks:
      return 'Unassigned tasks'
    case PhaseWatchSignal.OnTrack:
      return 'On track'
    default:
      return signal
  }
}

export function buildFollowUpLabels(
  activePhases: PhaseWatchPhaseSummary[],
  nextPhase: PhaseWatchPhaseSummary | null,
  signals: Signal[]
): string[] {
  const labels: string[] = []
  const blocked = activePhases.reduce((n, p) => n + p.blockedTaskCount, 0)
  if (blocked > 0) labels.push(`${blocked} blocked task${blocked === 1 ? '' : 's'}`)
  if (signals.includes(PhaseWatchSignal.EndingSoon)) {
    labels.push('Current phase ending soon')
  }
  if (nextPhase?.unassignedTaskCount) {
    labels.push(
      `${nextPhase.unassignedTaskCount} task${nextPhase.unassignedTaskCount === 1 ? '' : 's'} unassigned`
    )
  }
  if (signals.includes(PhaseWatchSignal.NoTasks) && nextPhase?.taskCount === 0) {
    labels.push('Next phase has no tasks')
  }
  if (signals.includes(PhaseWatchSignal.NoStartDate)) {
    labels.push('Start date not scheduled')
  }
  if (signals.includes(PhaseWatchSignal.StartingSoon) && nextPhase?.plannedStartDate) {
    labels.push('Next phase starting soon')
  }
  if (labels.length === 0 && signals.includes(PhaseWatchSignal.OnTrack)) {
    labels.push('Ready')
  }
  return labels
}

export function buildProjectPhaseWatchRow(input: {
  projectId: string
  projectName: string
  projectCode?: string | null
  phases: ProjectPhase[]
  tasks: ProjectTask[]
  todayIso: string
}): PhaseWatchProjectRow {
  const active = selectCurrentPhases(input.phases, input.todayIso).map((p) =>
    buildPhaseSummary(p, input.tasks)
  )
  const nextRaw = selectNextPhase(input.phases, input.todayIso)
  const nextPhase = nextRaw ? buildPhaseSummary(nextRaw, input.tasks) : null
  const signals = collectPhaseWatchSignals(active, nextPhase, input.todayIso)

  return {
    projectId: input.projectId,
    projectName: input.projectName,
    projectCode: input.projectCode ?? null,
    activePhases: active,
    nextPhase,
    signals,
    primarySignal: primaryPhaseWatchSignal(signals),
    followUpLabels: buildFollowUpLabels(active, nextPhase, signals),
  }
}

export function filterPhaseWatchRows(
  rows: PhaseWatchProjectRow[],
  kind: FollowUpKind | string
): PhaseWatchProjectRow[] {
  if (!kind || kind === PhaseWatchFollowUpKind.All) return rows
  return rows.filter((row) => {
    if (kind === PhaseWatchFollowUpKind.HasBlockers) {
      return row.signals.includes(PhaseWatchSignal.HasBlockers)
    }
    if (kind === PhaseWatchFollowUpKind.StartingSoon) {
      return row.signals.includes(PhaseWatchSignal.StartingSoon)
    }
    if (kind === PhaseWatchFollowUpKind.EndingSoon) {
      return row.signals.includes(PhaseWatchSignal.EndingSoon)
    }
    if (kind === PhaseWatchFollowUpKind.NoStartDate) {
      return row.signals.includes(PhaseWatchSignal.NoStartDate)
    }
    if (kind === PhaseWatchFollowUpKind.NoTasks) {
      return row.signals.includes(PhaseWatchSignal.NoTasks)
    }
    return true
  })
}

export function sortPhaseWatchRows(rows: PhaseWatchProjectRow[]): PhaseWatchProjectRow[] {
  const rank = (s: Signal) => {
    const i = SIGNAL_PRIORITY.indexOf(s)
    return i === -1 ? SIGNAL_PRIORITY.length : i
  }
  return [...rows].sort((a, b) => {
    const bySignal = rank(a.primarySignal) - rank(b.primarySignal)
    if (bySignal !== 0) return bySignal
    return a.projectName.localeCompare(b.projectName)
  })
}

export function formatPhaseWatchDate(iso: string | null | undefined): string {
  if (!iso) return 'Not scheduled'
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function phaseDisplayTitle(phase: Pick<PhaseWatchPhaseSummary, 'code' | 'name'>): string {
  return phase.code ? `${phase.code} · ${phase.name}` : phase.name
}
