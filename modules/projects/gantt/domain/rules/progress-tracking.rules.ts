import type { TaskProgressSnapshot } from '../model/progress-snapshot'
import {
  autoDailyAllocationMinutes,
} from './timeline-buckets.rules'
import { formatLocalDate, todayLocal } from './working-calendar.rules'

/** Last snapshot on or before `asOfDate` (YYYY-MM-DD). */
export function resolveActualProgressAsOf(
  snapshots: TaskProgressSnapshot[],
  taskId: string,
  asOfDate: string
): { percent: number; snapshotDate: string; isCarryForward: boolean } | null {
  const forTask = snapshots
    .filter((s) => s.taskId === taskId && s.snapshotDate <= asOfDate)
    .sort((a, b) => {
      if (a.snapshotDate !== b.snapshotDate) return a.snapshotDate < b.snapshotDate ? -1 : 1
      return a.recordedAt < b.recordedAt ? -1 : 1
    })
  if (forTask.length === 0) return null
  const last = forTask[forTask.length - 1]
  return {
    percent: last.progressPercent,
    snapshotDate: last.snapshotDate,
    isCarryForward: last.snapshotDate !== asOfDate,
  }
}

/** Cumulative planned % through end of `asOfDate` (inclusive). */
export function cumulativePlannedAsOf(
  startDate: string | null,
  endDate: string | null,
  estimateHours: number | null,
  asOfDate: string
): number | null {
  if (!startDate || !endDate) return null
  if (estimateHours == null || estimateHours <= 0) return null
  const daily = autoDailyAllocationMinutes(startDate, endDate, estimateHours)
  const total = [...daily.values()].reduce((s, m) => s + m, 0)
  if (total <= 0) return null
  let sum = 0
  for (const [day, minutes] of daily) {
    if (day <= asOfDate) sum += minutes
  }
  return Math.round((sum / total) * 1000) / 10
}

export function variancePercent(
  actual: number | null,
  plannedCumulative: number | null
): number | null {
  if (actual == null || plannedCumulative == null) return null
  return Math.round((actual - plannedCumulative) * 10) / 10
}

/** At-risk when behind plan by more than `thresholdPp` percentage points. */
export function isProgressAtRisk(
  variancePp: number | null,
  thresholdPp = -10
): boolean {
  return variancePp != null && variancePp <= thresholdPp
}

export function plannedVsActualToday(args: {
  startDate: string | null
  endDate: string | null
  estimateHours: number | null
  snapshots: TaskProgressSnapshot[]
  taskId: string
  today?: string
}): {
  plannedByToday: number | null
  actual: number | null
  variance: number | null
  atRisk: boolean
} {
  const today = args.today ?? formatLocalDate(todayLocal())
  const plannedByToday = cumulativePlannedAsOf(
    args.startDate,
    args.endDate,
    args.estimateHours,
    today
  )
  const actualHit = resolveActualProgressAsOf(args.snapshots, args.taskId, today)
  const actual = actualHit?.percent ?? null
  const variance = variancePercent(actual, plannedByToday)
  return {
    plannedByToday,
    actual,
    variance,
    atRisk: isProgressAtRisk(variance),
  }
}

export function latestProgressPercent(
  snapshots: TaskProgressSnapshot[],
  taskId: string
): number | null {
  const today = formatLocalDate(todayLocal())
  return resolveActualProgressAsOf(snapshots, taskId, today)?.percent ?? null
}
