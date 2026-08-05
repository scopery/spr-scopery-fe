/**
 * Domain rules for decision-support timeline Excel reports.
 * Pure — no ExcelJS / React.
 */

import { ganttItemTypeLabel, toDateOnly } from './gantt.rules'
import { formatLocalDate, todayLocal } from './working-calendar.rules'
import type { GanttItem } from '../model/gantt'
import type { TaskEnrichment } from './timeline-rows.rules'

export const ReportWorkStatus = {
  Structure: 'structure',
  Unscheduled: 'unscheduled',
  NotStarted: 'not_started',
  NotStartedLate: 'not_started_late',
  InProgress: 'in_progress',
  Completed: 'completed',
  AtRisk: 'at_risk',
  Delayed: 'delayed',
  Overdue: 'overdue',
} as const

export type ReportWorkStatus = (typeof ReportWorkStatus)[keyof typeof ReportWorkStatus]

export const REPORT_STATUS_LABEL: Record<ReportWorkStatus, string> = {
  structure: '—',
  unscheduled: 'Unscheduled',
  not_started: 'Not started',
  not_started_late: 'Not started (late)',
  in_progress: 'In progress',
  completed: 'Completed',
  at_risk: 'At risk',
  delayed: 'Delayed',
  overdue: 'Overdue',
}

export interface TimelineExcelEnrichment {
  status: string | null
  progressPercent: number | null
  atRisk: boolean
  inChargeUserId: string | null
  dueDate?: string | null
  estimateHours?: number | null
}

export interface TimelineExcelReportRow {
  wbs: string
  workItem: string
  typeLabel: string
  itemType: string
  owner: string
  reportStatus: ReportWorkStatus
  statusLabel: string
  planStart: string | null
  planEnd: string | null
  dueDate: string | null
  progressPercent: number | null
  /** Positive = days late vs plan end (or start late). */
  varianceDays: number | null
  isMilestone: boolean
  isLeafWork: boolean
  depth: number
  /** Technical fields for hidden Raw data sheet */
  raw: {
    ganttItemId: string
    sourceEntityId: string
    phaseId: string
    wbsNodeId: string
    assigneeUserId: string
    scheduleStatus: string
    parentItemId: string
  }
}

function parseDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dayDiff(a: string, b: string): number {
  const ms = parseDay(b).getTime() - parseDay(a).getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

function isCompletedTask(status: string | null, progress: number | null): boolean {
  const s = (status ?? '').toUpperCase()
  if (s === 'COMPLETED' || s === 'DONE' || s === 'CLOSED') return true
  return progress != null && progress >= 100
}

function isStructureType(itemType: string): boolean {
  const t = itemType.toUpperCase()
  return t === 'PROJECT' || t === 'PHASE' || t === 'WBS_NODE'
}

/**
 * Derive user-facing work status from plan dates + progress + task status.
 * Without Actual End we infer overdue from today > plan end && not completed.
 */
export function deriveReportWorkStatus(args: {
  itemType: string
  scheduleStatus: string
  planStart: string | null
  planEnd: string | null
  progressPercent: number | null
  taskStatus: string | null
  atRisk: boolean
  today?: string
}): ReportWorkStatus {
  const today = args.today ?? formatLocalDate(todayLocal())
  const type = (args.itemType ?? '').toUpperCase()
  const sched = (args.scheduleStatus ?? '').toUpperCase()

  if (isStructureType(type) || sched === 'NOT_APPLICABLE') {
    if (type === 'TASK' || type === 'MILESTONE') {
      /* fall through */
    } else {
      return ReportWorkStatus.Structure
    }
  }

  if (sched === 'UNSCHEDULED' || (!args.planStart && !args.planEnd)) {
    return ReportWorkStatus.Unscheduled
  }

  if (isCompletedTask(args.taskStatus, args.progressPercent)) {
    return ReportWorkStatus.Completed
  }

  if (args.planEnd && today > args.planEnd) {
    return ReportWorkStatus.Overdue
  }

  if (sched === 'DELAYED') return ReportWorkStatus.Delayed
  if (args.atRisk || sched === 'AT_RISK') return ReportWorkStatus.AtRisk

  const progress = args.progressPercent ?? 0
  if (args.planStart && today > args.planStart && progress <= 0) {
    return ReportWorkStatus.NotStartedLate
  }

  if (progress > 0 || (args.taskStatus ?? '').toUpperCase() === 'IN_PROGRESS') {
    return ReportWorkStatus.InProgress
  }

  if (args.planStart && today < args.planStart) {
    return ReportWorkStatus.NotStarted
  }

  return progress > 0 ? ReportWorkStatus.InProgress : ReportWorkStatus.NotStarted
}

export function computeVarianceDays(args: {
  reportStatus: ReportWorkStatus
  planStart: string | null
  planEnd: string | null
  today?: string
}): number | null {
  const today = args.today ?? formatLocalDate(todayLocal())
  if (args.reportStatus === ReportWorkStatus.Structure) return null
  if (args.reportStatus === ReportWorkStatus.Completed) return 0
  if (args.reportStatus === ReportWorkStatus.Overdue && args.planEnd) {
    return dayDiff(args.planEnd, today)
  }
  if (args.reportStatus === ReportWorkStatus.NotStartedLate && args.planStart) {
    return dayDiff(args.planStart, today)
  }
  if (args.reportStatus === ReportWorkStatus.Delayed && args.planEnd && today > args.planEnd) {
    return dayDiff(args.planEnd, today)
  }
  return 0
}

export function formatVarianceLabel(days: number | null): string {
  if (days == null) return '—'
  if (days === 0) return 'On track'
  if (days > 0) return `${days}d late`
  return `${Math.abs(days)}d early`
}

/** Assign WBS codes 1, 1.1, 1.2, 2… while flattening the tree. */
export function flattenGanttWithWbs(
  items: GanttItem[],
  parentWbs = ''
): Array<{ item: GanttItem; depth: number; wbs: string }> {
  const out: Array<{ item: GanttItem; depth: number; wbs: string }> = []
  let index = 0
  for (const item of items) {
    index += 1
    const wbs = parentWbs ? `${parentWbs}.${index}` : String(index)
    const depth = parentWbs ? parentWbs.split('.').length : 0
    out.push({ item, depth, wbs })
    if (item.children?.length) {
      out.push(...flattenGanttWithWbs(item.children, wbs))
    }
  }
  return out
}

export function mapEnrichment(
  item: GanttItem,
  bySourceId?: Map<string, TimelineExcelEnrichment | TaskEnrichment>
): TimelineExcelEnrichment | null {
  if (!bySourceId) return null
  return bySourceId.get(item.sourceEntityId) ?? null
}

export function buildTimelineExcelReportRows(
  items: GanttItem[],
  opts: {
    ownerLabelFor?: (userId: string) => string
    enrichmentBySourceId?: Map<string, TimelineExcelEnrichment | TaskEnrichment>
    today?: string
  } = {}
): TimelineExcelReportRow[] {
  const today = opts.today ?? formatLocalDate(todayLocal())
  const flat = flattenGanttWithWbs(items)

  return flat.map(({ item, depth, wbs }) => {
    const enrichment = mapEnrichment(item, opts.enrichmentBySourceId)
    const planStart = toDateOnly(item.startDate)
    const planEnd = toDateOnly(item.endDate)
    const dueDate =
      toDateOnly(enrichment?.dueDate) ?? planEnd
    const progress =
      enrichment?.progressPercent != null
        ? Math.round(enrichment.progressPercent)
        : null
    const ownerId = enrichment?.inChargeUserId ?? item.assigneeUserId
    const owner =
      ownerId && opts.ownerLabelFor
        ? opts.ownerLabelFor(ownerId)
        : ownerId
          ? ownerId
          : isStructureType(item.itemType)
            ? '—'
            : 'Unassigned'

    const reportStatus = deriveReportWorkStatus({
      itemType: item.itemType,
      scheduleStatus: item.scheduleStatus,
      planStart,
      planEnd,
      progressPercent: progress,
      taskStatus: enrichment?.status ?? null,
      atRisk: enrichment?.atRisk ?? false,
      today,
    })

    const varianceDays = computeVarianceDays({
      reportStatus,
      planStart,
      planEnd,
      today,
    })

    const itemType = (item.itemType ?? '').toUpperCase()
    const isMilestone =
      itemType === 'MILESTONE' ||
      Boolean(item.zeroDuration) ||
      Boolean(item.startDate && !item.endDate)

    return {
      wbs,
      workItem: item.title,
      typeLabel: ganttItemTypeLabel(item.itemType),
      itemType,
      owner,
      reportStatus,
      statusLabel: REPORT_STATUS_LABEL[reportStatus],
      planStart,
      planEnd,
      dueDate,
      progressPercent: progress,
      varianceDays,
      isMilestone,
      isLeafWork: itemType === 'TASK' || itemType === 'MILESTONE',
      depth,
      raw: {
        ganttItemId: item.id,
        sourceEntityId: item.sourceEntityId ?? '',
        phaseId: item.phaseId ?? '',
        wbsNodeId: item.wbsNodeId ?? '',
        assigneeUserId: ownerId ?? '',
        scheduleStatus: item.scheduleStatus ?? '',
        parentItemId: item.parentItemId ?? '',
      },
    }
  })
}

export interface TimelineExcelOverviewInsights {
  projectStart: string | null
  projectEnd: string | null
  timeElapsedPercent: number | null
  activePhasesToday: number
  overdueCount: number
  atRiskCount: number
  inProgressCount: number
  dueThisWeekCount: number
  upcoming14Count: number
  overallProgressPercent: number | null
  phasesWithTasks: number
  phaseCount: number
  daysBehindPlan: number
  topDelayTitles: string[]
  narrative: string
  overdueItems: Array<{ wbs: string; title: string; planEnd: string | null; varianceDays: number | null }>
  atRiskItems: Array<{ wbs: string; title: string; progress: number | null }>
  endingThisWeek: Array<{ wbs: string; title: string; planEnd: string | null }>
  upcoming14: Array<{ wbs: string; title: string; planStart: string | null }>
  workloadByOwner: Array<{ owner: string; count: number }>
}

function addDaysIso(dateOnly: string, days: number): string {
  const d = parseDay(dateOnly)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildTimelineExcelOverviewInsights(
  rows: TimelineExcelReportRow[],
  today = formatLocalDate(todayLocal())
): TimelineExcelOverviewInsights {
  const leaves = rows.filter((r) => r.isLeafWork)
  const phases = rows.filter((r) => r.itemType === 'PHASE')

  let projectStart: string | null = null
  let projectEnd: string | null = null
  for (const r of rows) {
    if (r.planStart && (!projectStart || r.planStart < projectStart)) projectStart = r.planStart
    if (r.planEnd && (!projectEnd || r.planEnd > projectEnd)) projectEnd = r.planEnd
  }

  let timeElapsedPercent: number | null = null
  if (projectStart && projectEnd && projectEnd > projectStart) {
    const total = dayDiff(projectStart, projectEnd)
    const elapsed = Math.min(total, Math.max(0, dayDiff(projectStart, today)))
    timeElapsedPercent = total > 0 ? Math.round((elapsed / total) * 100) : null
  }

  const weekEnd = addDaysIso(today, 7)
  const in14 = addDaysIso(today, 14)

  const overdueItems = leaves
    .filter((r) => r.reportStatus === ReportWorkStatus.Overdue)
    .map((r) => ({
      wbs: r.wbs,
      title: r.workItem,
      planEnd: r.planEnd,
      varianceDays: r.varianceDays,
    }))

  const atRiskItems = leaves
    .filter(
      (r) =>
        r.reportStatus === ReportWorkStatus.AtRisk ||
        r.reportStatus === ReportWorkStatus.NotStartedLate
    )
    .map((r) => ({
      wbs: r.wbs,
      title: r.workItem,
      progress: r.progressPercent,
    }))

  const endingThisWeek = leaves
    .filter(
      (r) =>
        r.planEnd &&
        r.planEnd >= today &&
        r.planEnd <= weekEnd &&
        r.reportStatus !== ReportWorkStatus.Completed
    )
    .map((r) => ({ wbs: r.wbs, title: r.workItem, planEnd: r.planEnd }))

  const upcoming14 = leaves
    .filter(
      (r) =>
        r.planStart &&
        r.planStart > today &&
        r.planStart <= in14 &&
        r.reportStatus !== ReportWorkStatus.Completed
    )
    .map((r) => ({ wbs: r.wbs, title: r.workItem, planStart: r.planStart }))

  const activePhasesToday = phases.filter((p) => {
    if (!p.planStart || !p.planEnd) return false
    return p.planStart <= today && p.planEnd >= today
  }).length

  const inProgressCount = leaves.filter(
    (r) => r.reportStatus === ReportWorkStatus.InProgress
  ).length

  const progressLeaves = leaves.filter((r) => r.progressPercent != null)
  const overallProgressPercent =
    progressLeaves.length > 0
      ? Math.round(
          progressLeaves.reduce((s, r) => s + (r.progressPercent ?? 0), 0) /
            progressLeaves.length
        )
      : null

  const phaseIdsWithTasks = new Set<string>()
  for (const r of leaves) {
    const parent = rows.find(
      (p) =>
        p.itemType === 'PHASE' &&
        (r.wbs.startsWith(`${p.wbs}.`) || r.raw.phaseId === p.raw.sourceEntityId)
    )
    if (parent) phaseIdsWithTasks.add(parent.wbs)
  }
  // Prefer: phase has a leaf descendant in WBS
  for (const phase of phases) {
    const hasLeaf = leaves.some((l) => l.wbs.startsWith(`${phase.wbs}.`))
    if (hasLeaf) phaseIdsWithTasks.add(phase.wbs)
  }

  const daysBehindPlan = Math.max(
    0,
    ...leaves
      .filter((r) => (r.varianceDays ?? 0) > 0)
      .map((r) => r.varianceDays ?? 0),
    0
  )

  const topDelayTitles = [...leaves]
    .filter((r) => (r.varianceDays ?? 0) > 0)
    .sort((a, b) => (b.varianceDays ?? 0) - (a.varianceDays ?? 0))
    .slice(0, 2)
    .map((r) => r.workItem)

  const workloadMap = new Map<string, number>()
  for (const r of leaves) {
    const key = r.owner && r.owner !== '—' ? r.owner : 'Unassigned'
    workloadMap.set(key, (workloadMap.get(key) ?? 0) + 1)
  }
  const workloadByOwner = [...workloadMap.entries()]
    .map(([owner, count]) => ({ owner, count }))
    .sort((a, b) => b.count - a.count)

  let narrative = 'Schedule looks on track based on available plan and progress data.'
  if (daysBehindPlan > 0 && topDelayTitles.length > 0) {
    narrative = `Project is currently ${daysBehindPlan} day${
      daysBehindPlan === 1 ? '' : 's'
    } behind plan, mainly due to ${topDelayTitles.join(' and ')}.`
  } else if (overdueItems.length > 0) {
    narrative = `${overdueItems.length} task${
      overdueItems.length === 1 ? '' : 's'
    } past plan end without completion — review overdue work first.`
  } else if (atRiskItems.length > 0) {
    narrative = `${atRiskItems.length} item${
      atRiskItems.length === 1 ? '' : 's'
    } at risk of slipping — progress is behind the expected plan curve.`
  }

  return {
    projectStart,
    projectEnd,
    timeElapsedPercent,
    activePhasesToday,
    overdueCount: overdueItems.length,
    atRiskCount: atRiskItems.length,
    inProgressCount,
    dueThisWeekCount: endingThisWeek.length,
    upcoming14Count: upcoming14.length,
    overallProgressPercent,
    phasesWithTasks: phaseIdsWithTasks.size,
    phaseCount: phases.length,
    daysBehindPlan,
    topDelayTitles,
    narrative,
    overdueItems,
    atRiskItems,
    endingThisWeek,
    upcoming14,
    workloadByOwner,
  }
}
