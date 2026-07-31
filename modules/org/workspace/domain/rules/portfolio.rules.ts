import { PhaseWatchSignal } from '@/modules/projects/phase/domain/enums/phase-watch.enum'
import type {
  PhaseWatchPhaseSummary,
  PhaseWatchProjectRow,
  PhaseWatchUnassignedTask,
} from '@/modules/projects/phase/domain/model/phase-watch'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'

export type PortfolioHealth = 'blocked' | 'at_risk' | 'on_track' | 'insufficient'

export interface PortfolioSummary {
  projectCount: number
  onTrack: number | null
  atRisk: number | null
  blocked: number | null
  unassignedTasks: number | null
  startingSoonPhases: number | null
  healthAvailable: boolean
}

export interface PortfolioAttentionItem {
  id: string
  severity: 'HIGH' | 'MEDIUM'
  title: string
  impact: string
  projectId: string | null
  projectName: string | null
  href: string
  ctaLabel: string
}

export function mapSignalToHealth(signal: PhaseWatchSignal): PortfolioHealth {
  switch (signal) {
    case PhaseWatchSignal.HasBlockers:
      return 'blocked'
    case PhaseWatchSignal.OnTrack:
      return 'on_track'
    case PhaseWatchSignal.EndingSoon:
    case PhaseWatchSignal.StartingSoon:
    case PhaseWatchSignal.NoStartDate:
    case PhaseWatchSignal.NoTasks:
    case PhaseWatchSignal.UnassignedTasks:
      return 'at_risk'
    default:
      return 'insufficient'
  }
}

export function healthLabel(health: PortfolioHealth): string {
  switch (health) {
    case 'blocked':
      return 'Blocked'
    case 'at_risk':
      return 'At risk'
    case 'on_track':
      return 'On track'
    default:
      return 'Health unavailable'
  }
}

/** Owner coverage on the phase — not a delivery score. */
export function phaseReadinessPercent(phase: PhaseWatchPhaseSummary | null): number | null {
  if (!phase) return null
  if (phase.taskCount === 0) return 0
  return Math.round(((phase.taskCount - phase.unassignedTaskCount) / phase.taskCount) * 100)
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return iso
  }
}

export function buildPortfolioSummary(rows: PhaseWatchProjectRow[]): PortfolioSummary {
  if (rows.length === 0) {
    return {
      projectCount: 0,
      onTrack: null,
      atRisk: null,
      blocked: null,
      unassignedTasks: null,
      startingSoonPhases: null,
      healthAvailable: false,
    }
  }

  let onTrack = 0
  let atRisk = 0
  let blocked = 0
  let unassignedTasks = 0
  let startingSoonPhases = 0

  for (const row of rows) {
    const health = mapSignalToHealth(row.primarySignal)
    if (health === 'blocked') blocked += 1
    else if (health === 'on_track') onTrack += 1
    else atRisk += 1
    unassignedTasks += row.unassignedTaskCount
    if (row.signals.includes(PhaseWatchSignal.StartingSoon)) startingSoonPhases += 1
  }

  return {
    projectCount: rows.length,
    onTrack,
    atRisk,
    blocked,
    unassignedTasks,
    startingSoonPhases,
    healthAvailable: true,
  }
}

export function sortPortfolioRows(rows: PhaseWatchProjectRow[]): PhaseWatchProjectRow[] {
  const rank = (row: PhaseWatchProjectRow) => {
    const h = mapSignalToHealth(row.primarySignal)
    if (h === 'blocked') return 0
    if (h === 'at_risk') {
      if (row.signals.includes(PhaseWatchSignal.StartingSoon)) return 1
      if (row.unassignedTaskCount > 0) return 2
      return 3
    }
    return 4
  }
  return [...rows].sort((a, b) => {
    const byRank = rank(a) - rank(b)
    if (byRank !== 0) return byRank
    return (
      b.unassignedTaskCount - a.unassignedTaskCount || a.projectName.localeCompare(b.projectName)
    )
  })
}

export function buildAttentionItems(
  rows: PhaseWatchProjectRow[],
  workspaceId: string,
  options?: { overAllocatedCount?: number; capacityHref?: string }
): PortfolioAttentionItem[] {
  const items: PortfolioAttentionItem[] = []

  if ((options?.overAllocatedCount ?? 0) > 0 && options?.capacityHref) {
    items.push({
      id: 'capacity-overload',
      severity: 'HIGH',
      title: `${options.overAllocatedCount} people are over-allocated`,
      impact: 'Upcoming work may slip if capacity is not rebalanced.',
      projectId: null,
      projectName: null,
      href: options.capacityHref,
      ctaLabel: 'Review capacity',
    })
  }

  for (const row of sortPortfolioRows(rows)) {
    if (items.length >= 6) break
    const health = mapSignalToHealth(row.primarySignal)
    const projectHref = WORKSPACE_ROUTES.projectDashboard(workspaceId, row.projectId)

    if (health === 'blocked') {
      const blocked = row.activePhases.reduce((n, p) => n + p.blockedTaskCount, 0)
      items.push({
        id: `blocked-${row.projectId}`,
        severity: 'HIGH',
        title: `${row.projectName} has blocked work`,
        impact: `${blocked || 'Several'} blocked task${blocked === 1 ? '' : 's'} on the active phase.`,
        projectId: row.projectId,
        projectName: row.projectName,
        href: projectHref,
        ctaLabel: 'Open project',
      })
      continue
    }

    if (row.unassignedTaskCount >= 3) {
      items.push({
        id: `unassigned-${row.projectId}`,
        severity: row.unassignedTaskCount >= 7 ? 'HIGH' : 'MEDIUM',
        title: `${row.projectName} has ${row.unassignedTaskCount} unassigned tasks`,
        impact: row.nextPhase
          ? `Next phase ${row.nextPhase.name} may slip without owners.`
          : 'Unowned work will delay delivery.',
        projectId: row.projectId,
        projectName: row.projectName,
        href: WORKSPACE_ROUTES.projectWork(workspaceId, row.projectId),
        ctaLabel: 'Assign tasks',
      })
      continue
    }

    if (row.signals.includes(PhaseWatchSignal.StartingSoon) && row.nextPhase) {
      items.push({
        id: `soon-${row.projectId}`,
        severity: 'MEDIUM',
        title: `${row.projectName} · ${row.nextPhase.name} starts soon`,
        impact: row.nextPhase.plannedStartDate
          ? `Planned start ${formatShortDate(row.nextPhase.plannedStartDate)}.`
          : 'Upcoming phase needs readiness review.',
        projectId: row.projectId,
        projectName: row.projectName,
        href: projectHref,
        ctaLabel: 'Review phase',
      })
    }
  }

  return items.slice(0, 6)
}

export function flattenUnassignedTasks(
  rows: PhaseWatchProjectRow[]
): Array<PhaseWatchUnassignedTask & { projectId: string; projectName: string }> {
  const out: Array<PhaseWatchUnassignedTask & { projectId: string; projectName: string }> = []
  for (const row of sortPortfolioRows(rows)) {
    for (const task of row.topUnassignedTasks) {
      out.push({ ...task, projectId: row.projectId, projectName: row.projectName })
    }
  }
  return out
    .sort((a, b) => {
      const ad = a.dueDate ?? '9999-12-31'
      const bd = b.dueDate ?? '9999-12-31'
      return ad.localeCompare(bd)
    })
    .slice(0, 20)
}

export type PortfolioMetricFilter =
  | 'all'
  | 'on_track'
  | 'at_risk'
  | 'blocked'
  | 'unassigned'
  | 'starting_soon'

export function filterPortfolioRows(
  rows: PhaseWatchProjectRow[],
  filter: PortfolioMetricFilter
): PhaseWatchProjectRow[] {
  if (filter === 'all') return rows
  if (filter === 'unassigned') return rows.filter((r) => r.unassignedTaskCount > 0)
  if (filter === 'starting_soon') {
    return rows.filter((r) => r.signals.includes(PhaseWatchSignal.StartingSoon))
  }
  return rows.filter((r) => mapSignalToHealth(r.primarySignal) === filter)
}
