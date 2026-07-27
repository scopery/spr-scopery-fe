import { MyInsightsHealthStatus, MyInsightsWorkloadState } from '../../domain/enums/my-insights.enum'
import type { MyInsightsParams, MyInsightsResponse } from '../../domain/model/my-insights'

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

function resolveRange(params?: MyInsightsParams): { range: string; dateFrom: string; dateTo: string } {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const range = params?.range ?? '30d'
  if (range === 'custom' && params?.dateFrom && params?.dateTo) {
    return { range, dateFrom: params.dateFrom, dateTo: params.dateTo }
  }
  let from = new Date(today)
  if (range === '7d') from = addDays(today, -6)
  else if (range === '90d') from = addDays(today, -89)
  else if (range === 'this_year') from = new Date(today.getFullYear(), 0, 1, 12)
  else from = addDays(today, -29)
  return { range, dateFrom: toIsoDate(from), dateTo: toIsoDate(today) }
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function buildMockMyInsights(
  workspaceId: string,
  params?: MyInsightsParams
): MyInsightsResponse {
  const { range, dateFrom, dateTo } = resolveRange(params)
  const today = new Date(`${dateTo}T12:00:00`)

  const heatmapDays = []
  for (let i = 364; i >= 0; i--) {
    const d = addDays(today, -i)
    const iso = toIsoDate(d)
    const h = hash(iso)
    const level = (h % 11 === 0 ? 0 : (h % 5)) as 0 | 1 | 2 | 3 | 4
    heatmapDays.push({
      date: iso,
      level,
      completedTasks: level === 0 ? 0 : (h % 5) + 1,
      completedEffortHours: level === 0 ? 0 : Number((((h % 80) / 10) + 0.5).toFixed(1)),
      overdueResolved: level >= 3 ? h % 2 : 0,
      projectCount: level === 0 ? 0 : (h % 3) + 1,
      completedTaskItems:
        level === 0
          ? []
          : Array.from({ length: (h % 3) + 1 }, (_, idx) => ({
              taskId: `mock-${iso}-${idx}`,
              projectId: `proj-${(h + idx) % 3}`,
              projectName: ['Scopery', 'HM Logistics', 'Website'][(h + idx) % 3]!,
              title: `Completed task ${idx + 1}`,
              estimateHours: ((h + idx) % 4) + 1,
            })),
    })
  }

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const planned = [5, 9, 4, 6, 7]
  const workloadDays = weekdays.map((label, idx) => {
    const date = addDays(today, idx - today.getDay() + 1)
    const plannedHours = planned[idx]!
    const capacityHours = 8
    const ratio = plannedHours / capacityHours
    const state =
      ratio > 1
        ? MyInsightsWorkloadState.Overloaded
        : ratio > 0.8
          ? MyInsightsWorkloadState.NearCapacity
          : MyInsightsWorkloadState.Normal
    return {
      date: toIsoDate(date),
      weekdayLabel: label,
      plannedHours,
      capacityHours,
      state,
    }
  })

  const plannedVsCompleted = Array.from({ length: 8 }, (_, i) => {
    const weekStart = addDays(today, -((7 - i) * 7))
    const plannedHours = 28 + ((i * 3) % 11)
    const completedHours = Math.max(16, plannedHours - (i % 4) * 3)
    return {
      weekLabel: `W${i + 1}`,
      weekStart: toIsoDate(weekStart),
      plannedHours,
      completedHours,
      carryOverHours: Math.max(0, plannedHours - completedHours),
    }
  })

  return {
    workspaceId,
    userId: 'mock-user',
    range,
    dateFrom,
    dateTo,
    projects: [
      { id: 'p-scopery', name: 'Scopery' },
      { id: 'p-hm', name: 'HM Logistics' },
      { id: 'p-personal', name: 'Personal' },
    ],
    summary: {
      remaining: 18,
      overdue: 3,
      blocked: 2,
      completed: 24,
      dueSoon: 7,
      unscheduled: 4,
    },
    attention: [
      { kind: 'overdue', label: 'Overdue', count: 3 },
      { kind: 'unscheduled', label: 'Unscheduled', count: 4 },
      { kind: 'blocked', label: 'Blocked', count: 2 },
      { kind: 'missing_estimate', label: 'Missing estimate', count: 5 },
      { kind: 'dependency_conflict', label: 'Dependency conflict', count: 1 },
    ],
    workload: {
      capacityConfigured: true,
      days: workloadDays,
    },
    heatmap: {
      metric: params?.heatmapMetric ?? 'completed_effort',
      days: heatmapDays,
    },
    plannedVsCompleted,
    distribution: [
      { key: 'scopery', label: 'Scopery', hours: 38.4, percent: 48 },
      { key: 'hm', label: 'HM Logistics', hours: 19.2, percent: 24 },
      { key: 'personal', label: 'Personal', hours: 12.8, percent: 16 },
      { key: 'other', label: 'Other', hours: 9.6, percent: 12 },
    ],
    currentWork: [
      {
        taskId: 't1',
        projectId: 'p-scopery',
        projectName: 'Scopery',
        phaseName: 'Phase 44',
        title: 'Review Change Request impact',
        dueDate: dateTo,
        plannedStartDate: toIsoDate(addDays(today, -2)),
        estimateHours: 2,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        chips: ['today', 'overdue'],
      },
      {
        taskId: 't2',
        projectId: 'p-hm',
        projectName: 'HM Logistics',
        phaseName: 'Build',
        title: 'Finalize warehouse API contract',
        dueDate: toIsoDate(addDays(today, 1)),
        plannedStartDate: null,
        estimateHours: 4,
        status: 'TODO',
        priority: 'MEDIUM',
        chips: ['upcoming'],
      },
      {
        taskId: 't3',
        projectId: 'p-scopery',
        projectName: 'Scopery',
        phaseName: 'Phase 44',
        title: 'Unblock document sync retry path',
        dueDate: toIsoDate(addDays(today, 2)),
        plannedStartDate: toIsoDate(addDays(today, 1)),
        estimateHours: 3,
        status: 'BLOCKED',
        priority: 'CRITICAL',
        chips: ['blocked', 'upcoming'],
      },
      {
        taskId: 't4',
        projectId: 'p-personal',
        projectName: 'Personal',
        phaseName: null,
        title: 'Draft weekly capacity notes',
        dueDate: null,
        plannedStartDate: null,
        estimateHours: null,
        status: 'TODO',
        priority: 'LOW',
        chips: ['unscheduled'],
      },
      {
        taskId: 't5',
        projectId: 'p-scopery',
        projectName: 'Scopery',
        phaseName: 'Phase 43',
        title: 'Align My Insights API fields',
        dueDate: toIsoDate(addDays(today, -1)),
        plannedStartDate: toIsoDate(addDays(today, -3)),
        estimateHours: 2,
        status: 'TODO',
        priority: 'HIGH',
        chips: ['overdue'],
      },
    ],
    health: {
      status: MyInsightsHealthStatus.OnTrack,
      statusLabel: 'On track',
      metrics: [
        { key: 'completion', label: 'Completion rate', valuePercent: 82, trendPercent: 11 },
        { key: 'carry_over', label: 'Carry-over rate', valuePercent: 14, trendPercent: -4 },
        { key: 'overdue', label: 'Overdue rate', valuePercent: 6, trendPercent: -2 },
        { key: 'estimate_accuracy', label: 'Estimate accuracy', valuePercent: 76, trendPercent: 3 },
      ],
    },
    carryOver: {
      thisPeriodTasks: 3,
      previousPeriodTasks: 6,
      trendPercent: -50,
      trendLabel: 'Improved 50%',
      reasons: [
        { label: 'Blocked', count: 2 },
        { label: 'Over capacity', count: 1 },
        { label: 'Priority changed', count: 1 },
      ],
      weekly: [
        { weekLabel: 'W1', count: 6 },
        { weekLabel: 'W2', count: 5 },
        { weekLabel: 'W3', count: 4 },
        { weekLabel: 'W4', count: 5 },
        { weekLabel: 'W5', count: 3 },
        { weekLabel: 'W6', count: 4 },
        { weekLabel: 'W7', count: 3 },
        { weekLabel: 'W8', count: 3 },
      ],
    },
    consistency: {
      activeDays: 18,
      workingDays: 22,
      currentStreak: 4,
      longestStreak: 11,
      noOverdueDays: 15,
    },
    aiReview: {
      available: true,
      summary:
        'Your completion rate improved from 71% to 82%. Tuesday was overloaded and two tasks carried over because dependencies were late.',
      needsAttention: [
        'Tuesday was overloaded by 3 hours.',
        'Two tasks carried over because dependencies were late.',
        '31% of completed effort was outside your selected priorities.',
      ],
      suggestedAdjustment:
        'Move low-priority work to Thursday and resolve blocked tasks first.',
      affectedTaskIds: ['t1', 't3', 't5'],
    },
  }
}
