import { MyInsightsHealthStatus } from '../../domain/enums/my-insights.enum'
import type { MyInsightsParams, MyInsightsResponse, MyInsightsTaskRow } from '../../domain/model/my-insights'
import type { MyWorkResponse, MyWorkTaskItem } from '../../domain/model/my-work'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function parseDay(iso: string | null | undefined): string | null {
  if (!iso) return null
  // Accept "2026-07-29", ISO datetime, or odd stringified values
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

function normalizeMyWorkTask(t: MyWorkTaskItem): MyWorkTaskItem {
  return {
    ...t,
    taskId: String(t.taskId ?? ''),
    projectId: String(t.projectId ?? ''),
    dueDate: parseDay(t.dueDate) ?? t.dueDate,
    plannedStartDate: parseDay(t.plannedStartDate) ?? t.plannedStartDate,
    estimateHours: t.estimateHours == null ? null : Number(t.estimateHours),
  }
}

function asTaskList(items: MyWorkTaskItem[] | null | undefined): MyWorkTaskItem[] {
  if (!items) return []
  if (!Array.isArray(items)) return [items as MyWorkTaskItem]
  return items
}

function dedupeTasks(items: MyWorkTaskItem[]): MyWorkTaskItem[] {
  const seen = new Set<string>()
  const out: MyWorkTaskItem[] = []
  for (const raw of items) {
    const t = normalizeMyWorkTask(raw)
    if (!t.taskId || seen.has(t.taskId)) continue
    seen.add(t.taskId)
    out.push(t)
  }
  return out
}

export function resolveInsightsRange(params?: MyInsightsParams): {
  range: string
  dateFrom: string
  dateTo: string
} {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const range = params?.range ?? '30d'
  if (range === 'custom' && params?.dateFrom && params?.dateTo) {
    return { range, dateFrom: params.dateFrom, dateTo: params.dateTo }
  }
  let from = addDays(today, -29)
  if (range === '7d') from = addDays(today, -6)
  else if (range === '90d') from = addDays(today, -89)
  else if (range === 'this_year') from = new Date(today.getFullYear(), 0, 1, 12)
  return { range, dateFrom: toIsoDate(from), dateTo: toIsoDate(today) }
}

function isTerminal(status: string) {
  return status === 'DONE' || status === 'COMPLETED' || status === 'CANCELLED' || status === 'ARCHIVED'
}

function isOpen(status: string) {
  return !isTerminal(status)
}

function taskChips(t: MyWorkTaskItem, todayIso: string): MyInsightsTaskRow['chips'] {
  const chips: MyInsightsTaskRow['chips'] = []
  if (t.isOverdue) chips.push('overdue')
  if (t.status === 'BLOCKED') chips.push('blocked')
  if (!t.dueDate && !t.plannedStartDate) chips.push('unscheduled')
  if (t.dueDate === todayIso) chips.push('today')
  else if (t.dueDate && t.dueDate > todayIso) chips.push('upcoming')
  else if (!t.dueDate && t.plannedStartDate && t.plannedStartDate >= todayIso) chips.push('upcoming')
  return chips
}

function toCurrentWorkRow(t: MyWorkTaskItem, todayIso: string): MyInsightsTaskRow {
  return {
    taskId: t.taskId,
    projectId: t.projectId,
    projectName: t.projectName || t.projectCode || 'Project',
    phaseName: t.projectPhaseName,
    title: t.title,
    dueDate: t.dueDate,
    plannedStartDate: t.plannedStartDate,
    estimateHours: t.estimateHours,
    status: t.status,
    priority: t.priority || null,
    chips: taskChips(t, todayIso),
  }
}

function buildHeatmap(items: MyWorkTaskItem[], today: Date): MyInsightsResponse['heatmap'] {
  const byDay = new Map<
    string,
    {
      completedTasks: number
      completedEffortHours: number
      overdueResolved: number
      projects: Set<string>
      completedTaskItems: Array<{
        taskId: string
        projectId: string
        projectName: string
        title: string
        estimateHours: number | null
      }>
    }
  >()

  for (let i = 364; i >= 0; i--) {
    byDay.set(toIsoDate(addDays(today, -i)), {
      completedTasks: 0,
      completedEffortHours: 0,
      overdueResolved: 0,
      projects: new Set(),
      completedTaskItems: [],
    })
  }

  for (const t of items) {
    const day = parseDay(t.updatedAt) ?? t.dueDate ?? t.plannedStartDate
    if (!day || !byDay.has(day)) continue
    const bucket = byDay.get(day)!
    bucket.projects.add(t.projectId)
    if (isTerminal(t.status) && (t.status === 'DONE' || t.status === 'COMPLETED')) {
      bucket.completedTasks += 1
      bucket.completedEffortHours += t.estimateHours ?? 0
      if (t.isOverdue || (t.dueDate && t.dueDate < day)) bucket.overdueResolved += 1
      bucket.completedTaskItems.push({
        taskId: t.taskId,
        projectId: t.projectId,
        projectName: t.projectName || t.projectCode || 'Project',
        title: t.title,
        estimateHours: t.estimateHours,
      })
    } else if (isOpen(t.status)) {
      // Treat open-task activity on updated day as light activity signal
      bucket.completedEffortHours += (t.estimateHours ?? 0) * 0.15
    }
  }

  const days = [...byDay.entries()].map(([date, v]) => {
    const effort = v.completedEffortHours
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (effort > 0 || v.completedTasks > 0) {
      if (effort >= 8 || v.completedTasks >= 4) level = 4
      else if (effort >= 5 || v.completedTasks >= 3) level = 3
      else if (effort >= 2 || v.completedTasks >= 2) level = 2
      else level = 1
    }
    return {
      date,
      level,
      completedTasks: v.completedTasks,
      completedEffortHours: Number(effort.toFixed(1)),
      overdueResolved: v.overdueResolved,
      projectCount: v.projects.size,
      completedTaskItems: v.completedTaskItems,
    }
  })

  return { metric: 'completed_effort', days }
}

function buildDistribution(items: MyWorkTaskItem[]): MyInsightsResponse['distribution'] {
  const map = new Map<string, { label: string; hours: number }>()
  for (const t of items) {
    const hours = t.estimateHours ?? 0
    if (hours <= 0 && !isTerminal(t.status)) {
      // still count presence with 1h placeholder weight for open tasks without estimate
    }
    const weight = hours > 0 ? hours : isOpen(t.status) ? 1 : 0
    if (weight <= 0) continue
    const existing = map.get(t.projectId)
    if (existing) existing.hours += weight
    else map.set(t.projectId, { label: t.projectName || t.projectCode || 'Project', hours: weight })
  }
  const rows = [...map.entries()]
    .map(([key, v]) => ({ key, label: v.label, hours: Number(v.hours.toFixed(1)) }))
    .sort((a, b) => b.hours - a.hours)
  const total = rows.reduce((s, r) => s + r.hours, 0) || 1
  return rows.slice(0, 8).map((r) => ({
    ...r,
    percent: Math.round((r.hours / total) * 100),
  }))
}

function buildPlannedVsCompleted(items: MyWorkTaskItem[], today: Date): MyInsightsResponse['plannedVsCompleted'] {
  const points = []
  for (let i = 7; i >= 0; i--) {
    const weekEnd = addDays(today, -i * 7)
    const weekStart = addDays(weekEnd, -6)
    const from = toIsoDate(weekStart)
    const to = toIsoDate(weekEnd)
    let plannedHours = 0
    let completedHours = 0
    for (const t of items) {
      const due = t.dueDate ?? t.plannedStartDate
      if (due && due >= from && due <= to) plannedHours += t.estimateHours ?? 0
      const updated = parseDay(t.updatedAt)
      if (
        updated &&
        updated >= from &&
        updated <= to &&
        (t.status === 'DONE' || t.status === 'COMPLETED')
      ) {
        completedHours += t.estimateHours ?? 0
      }
    }
    points.push({
      weekLabel: `W${8 - i}`,
      weekStart: from,
      plannedHours: Number(plannedHours.toFixed(1)),
      completedHours: Number(completedHours.toFixed(1)),
      carryOverHours: Math.max(0, Number((plannedHours - completedHours).toFixed(1))),
    })
  }
  return points
}

function buildConsistency(items: MyWorkTaskItem[], today: Date): MyInsightsResponse['consistency'] {
  const active = new Set<string>()
  for (const t of items) {
    const day = parseDay(t.updatedAt)
    if (day) active.add(day)
  }
  const workingDays = 22
  let currentStreak = 0
  for (let i = 0; i < 60; i++) {
    const day = toIsoDate(addDays(today, -i))
    if (active.has(day)) currentStreak += 1
    else if (i > 0) break
  }
  let longest = 0
  let run = 0
  for (let i = 364; i >= 0; i--) {
    const day = toIsoDate(addDays(today, -i))
    if (active.has(day)) {
      run += 1
      longest = Math.max(longest, run)
    } else run = 0
  }
  let noOverdueDays = 0
  for (let i = 0; i < 30; i++) {
    const day = toIsoDate(addDays(today, -i))
    const hadOverdue = items.some(
      (t) => isOpen(t.status) && t.dueDate && t.dueDate < day && parseDay(t.updatedAt) === day
    )
    if (!hadOverdue) noOverdueDays += 1
  }
  return {
    activeDays: [...active].filter((d) => d >= toIsoDate(addDays(today, -29))).length,
    workingDays,
    currentStreak,
    longestStreak: longest,
    noOverdueDays,
  }
}

function buildHealth(summary: {
  remaining: number
  overdue: number
  blocked: number
  completed: number
}): MyInsightsResponse['health'] {
  const denom = summary.completed + summary.remaining
  const completion =
    denom > 0 ? Math.round((summary.completed / denom) * 100) : null
  const overdueRate =
    summary.remaining > 0 ? Math.round((summary.overdue / summary.remaining) * 100) : null
  const blockedRate =
    summary.remaining > 0 ? Math.round((summary.blocked / summary.remaining) * 100) : null

  let status: string = MyInsightsHealthStatus.InsufficientData
  let statusLabel = 'Insufficient data'
  if (completion != null) {
    if ((overdueRate ?? 0) > 25 || (blockedRate ?? 0) > 20) {
      status = MyInsightsHealthStatus.NeedsAttention
      statusLabel = 'Needs attention'
    } else if (completion >= 70) {
      status = MyInsightsHealthStatus.OnTrack
      statusLabel = 'On track'
    } else {
      status = MyInsightsHealthStatus.NeedsAttention
      statusLabel = 'Needs attention'
    }
  }

  return {
    status,
    statusLabel,
    metrics: [
      { key: 'completion', label: 'Completion rate', valuePercent: completion, trendPercent: null },
      {
        key: 'carry_over',
        label: 'Carry-over rate',
        valuePercent:
          summary.remaining > 0
            ? Math.round((summary.overdue / Math.max(summary.remaining, 1)) * 100)
            : null,
        trendPercent: null,
      },
      { key: 'overdue', label: 'Overdue rate', valuePercent: overdueRate, trendPercent: null },
      { key: 'estimate_accuracy', label: 'Estimate accuracy', valuePercent: null, trendPercent: null },
    ],
  }
}

export interface MyWorkInsightsBundle {
  open: MyWorkResponse
  inRange: MyWorkResponse
  overdue: MyWorkResponse
  upcoming: MyWorkResponse
  range: string
  dateFrom: string
  dateTo: string
}

export function mapMyWorkBundleToInsights(bundle: MyWorkInsightsBundle): MyInsightsResponse {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const todayIso = toIsoDate(today)

  // Merge ALL_OPEN + UPCOMING + OVERDUE so due-soon tasks aren't dropped if one window is thin.
  const openItems = dedupeTasks([
    ...asTaskList(bundle.open.items),
    ...asTaskList(bundle.upcoming.items),
    ...asTaskList(bundle.overdue.items),
  ]).filter((t) => isOpen(t.status))

  const rangeItems = dedupeTasks(asTaskList(bundle.inRange.items))
  const allForAnalytics = dedupeTasks([...openItems, ...rangeItems])

  const completedInRange = rangeItems.filter(
    (t) => t.status === 'DONE' || t.status === 'COMPLETED'
  ).length

  const remaining = Math.max(bundle.open.summary.total, openItems.length)
  const overdue = bundle.open.summary.overdue
  const blocked = bundle.open.summary.blocked

  const unscheduled = openItems.filter((t) => !t.dueDate && !t.plannedStartDate).length
  const missingEstimate = openItems.filter((t) => t.estimateHours == null).length
  const noDueDate = openItems.filter((t) => !t.dueDate).length

  const projectsMap = new Map<string, string>()
  for (const t of allForAnalytics) {
    projectsMap.set(t.projectId, t.projectName || t.projectCode || 'Project')
  }

  const carryThis = openItems.filter(
    (t) => t.dueDate && t.dueDate < bundle.dateFrom
  ).length

  return {
    workspaceId: bundle.open.workspaceId,
    userId: bundle.open.userId,
    range: bundle.range,
    dateFrom: bundle.dateFrom,
    dateTo: bundle.dateTo,
    projects: [...projectsMap.entries()].map(([id, name]) => ({ id, name })),
    summary: {
      remaining,
      overdue,
      blocked,
      completed: completedInRange,
      dueSoon: bundle.upcoming.summary.dueThisWindow || bundle.upcoming.items.length,
      unscheduled,
    },
    attention: [
      { kind: 'overdue', label: 'Overdue', count: overdue },
      { kind: 'unscheduled', label: 'Unscheduled', count: unscheduled },
      { kind: 'blocked', label: 'Blocked', count: blocked },
      { kind: 'missing_estimate', label: 'Missing estimate', count: missingEstimate },
      { kind: 'no_due_date', label: 'No due date', count: noDueDate },
    ].filter((g) => g.count > 0),
    workload: { capacityConfigured: false, days: [] },
    heatmap: buildHeatmap(allForAnalytics, today),
    plannedVsCompleted: buildPlannedVsCompleted(allForAnalytics, today),
    distribution: buildDistribution(allForAnalytics),
    currentWork: openItems.map((t) => toCurrentWorkRow(t, todayIso)),
    health: buildHealth({ remaining, overdue, blocked, completed: completedInRange }),
    carryOver: {
      thisPeriodTasks: carryThis,
      previousPeriodTasks: 0,
      trendPercent: null,
      trendLabel: null,
      reasons: [
        { label: 'Blocked', count: blocked },
        { label: 'Overdue', count: overdue },
        { label: 'Unscheduled', count: unscheduled },
      ].filter((r) => r.count > 0),
      weekly: buildPlannedVsCompleted(allForAnalytics, today).map((p) => ({
        weekLabel: p.weekLabel,
        count: Math.round((p.carryOverHours ?? 0) > 0 ? Math.max(1, (p.carryOverHours ?? 0) / 4) : 0),
      })),
    },
    consistency: buildConsistency(allForAnalytics, today),
    aiReview: {
      available: false,
      summary: null,
      needsAttention: [],
      suggestedAdjustment: null,
      affectedTaskIds: [],
    },
  }
}
