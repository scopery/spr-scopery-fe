import type { TimelineBucketCell, TimelineColumn } from '../model/timeline'
import type { TaskProgressSnapshot } from '../model/progress-snapshot'
import type { TaskAllocationPlan } from '../model/allocation'
import { TimelineGranularity } from '../enums/timeline.enum'
import type { TimelineGranularity as Granularity } from '../enums/timeline.enum'
import {
  resolveActualProgressAsOf,
  variancePercent,
} from './progress-tracking.rules'
import { occupancyPercent, resolveDailyAllocationMinutes } from './allocation.rules'
import {
  addLocalDays,
  eachCalendarDay,
  eachWorkingDay,
  endOfMonth,
  endOfWeekSunday,
  formatLocalDate,
  isWeekend,
  parseLocalDate,
  startOfMonth,
  startOfWeekMonday,
  todayLocal,
} from './working-calendar.rules'

const MINUTES_PER_DAY = 8 * 60

function monthShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short' })
}

function yearShort(year: number): string {
  return `’${String(year).slice(-2)}`
}

function monthYearLabel(d: Date, includeYear: boolean): string {
  return includeYear ? `${monthShort(d)} ${yearShort(d.getFullYear())}` : monthShort(d)
}

/**
 * Option B — show month/year only when context changes (new month/year, or
 * week spanning months). Otherwise keep a compact secondary label.
 */
export function buildTimelineColumns(
  rangeStart: string,
  rangeEnd: string,
  granularity: Granularity
): TimelineColumn[] {
  const start = parseLocalDate(rangeStart)
  const end = parseLocalDate(rangeEnd)
  if (!start || !end || end < start) return []

  const today = formatLocalDate(todayLocal())

  if (granularity === TimelineGranularity.Day) {
    const days = eachCalendarDay(rangeStart, rangeEnd)
    return days.map((iso, index) => {
      const d = parseLocalDate(iso)!
      const prev = index > 0 ? parseLocalDate(days[index - 1])! : null
      const monthChanged =
        !prev ||
        prev.getMonth() !== d.getMonth() ||
        prev.getFullYear() !== d.getFullYear()
      const yearChanged = !prev || prev.getFullYear() !== d.getFullYear()
      return {
        key: iso,
        label: String(d.getDate()),
        subLabel: monthChanged
          ? monthYearLabel(d, yearChanged || index === 0)
          : d.toLocaleDateString('en-US', { weekday: 'short' }),
        periodStart: iso,
        periodEnd: iso,
        isWeekend: isWeekend(d),
        isToday: iso === today,
        // Skip index 0 — left edge of the grid already has a pane border.
        isMonthBoundary: monthChanged && index > 0,
      }
    })
  }

  if (granularity === TimelineGranularity.Week) {
    const cols: TimelineColumn[] = []
    let cursor = startOfWeekMonday(start)
    const last = end
    while (cursor <= last) {
      const weekEnd = endOfWeekSunday(cursor)
      const ps = formatLocalDate(cursor)
      const pe = formatLocalDate(weekEnd)
      const weekNum = getIsoWeek(cursor)
      const prev = cols.length > 0 ? parseLocalDate(cols[cols.length - 1]!.periodStart)! : null
      const crossMonth =
        cursor.getMonth() !== weekEnd.getMonth() ||
        cursor.getFullYear() !== weekEnd.getFullYear()
      const monthChanged =
        !prev ||
        prev.getMonth() !== cursor.getMonth() ||
        prev.getFullYear() !== cursor.getFullYear()
      const yearChanged = !prev || prev.getFullYear() !== cursor.getFullYear()

      let subLabel: string
      if (crossMonth) {
        const sameYear = cursor.getFullYear() === weekEnd.getFullYear()
        subLabel = sameYear
          ? `${monthShort(cursor)}–${monthShort(weekEnd)}${yearChanged || cols.length === 0 ? ` ${yearShort(cursor.getFullYear())}` : ''}`
          : `${monthYearLabel(cursor, true)}–${monthYearLabel(weekEnd, true)}`
      } else if (monthChanged || cols.length === 0) {
        subLabel = monthYearLabel(cursor, yearChanged || cols.length === 0)
      } else {
        subLabel = `${cursor.getDate()}–${weekEnd.getDate()}`
      }

      cols.push({
        key: `W${ps}`,
        label: `W${weekNum}`,
        subLabel,
        periodStart: ps,
        periodEnd: pe,
        isWeekend: false,
        isToday: today >= ps && today <= pe,
        isMonthBoundary: monthChanged && cols.length > 0,
      })
      cursor = addLocalDays(weekEnd, 1)
    }
    return cols
  }

  if (granularity === TimelineGranularity.Quarter) {
    const cols: TimelineColumn[] = []
    let cursor = startOfMonth(start)
    cursor = new Date(cursor.getFullYear(), Math.floor(cursor.getMonth() / 3) * 3, 1)
    while (cursor <= end) {
      const q = Math.floor(cursor.getMonth() / 3) + 1
      const qEnd = endOfMonth(new Date(cursor.getFullYear(), cursor.getMonth() + 2, 1))
      const ps = formatLocalDate(cursor)
      const pe = formatLocalDate(qEnd)
      const prevYear =
        cols.length > 0
          ? parseLocalDate(cols[cols.length - 1]!.periodStart)!.getFullYear()
          : null
      const showYear = prevYear == null || prevYear !== cursor.getFullYear()
      cols.push({
        key: `Q${ps}`,
        label: `Q${q}`,
        subLabel: showYear ? String(cursor.getFullYear()) : undefined,
        periodStart: ps,
        periodEnd: pe,
        isWeekend: false,
        isToday: today >= ps && today <= pe,
        // Only year changes — every quarter already reads as its own unit.
        isMonthBoundary: showYear && cols.length > 0,
      })
      cursor = addLocalDays(qEnd, 1)
    }
    return cols
  }

  // Month
  const cols: TimelineColumn[] = []
  let cursor = startOfMonth(start)
  while (cursor <= end) {
    const monthEnd = endOfMonth(cursor)
    const ps = formatLocalDate(cursor)
    const pe = formatLocalDate(monthEnd)
    const prevYear =
      cols.length > 0
        ? parseLocalDate(cols[cols.length - 1]!.periodStart)!.getFullYear()
        : null
    const showYear = prevYear == null || prevYear !== cursor.getFullYear()
    cols.push({
      key: `M${ps}`,
      label: monthShort(cursor),
      subLabel: showYear ? String(cursor.getFullYear()) : undefined,
      periodStart: ps,
      periodEnd: pe,
      isWeekend: false,
      isToday: today >= ps && today <= pe,
      // Each col is already a month — only emphasize year changes.
      isMonthBoundary: showYear && cols.length > 0,
    })
    cursor = addLocalDays(monthEnd, 1)
  }
  return cols
}

function getIsoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Auto-allocate estimate evenly across working days in [start, end].
 * Returns minutes per calendar day (0 on weekends / outside schedule).
 */
export function autoDailyAllocationMinutes(
  startDate: string | null,
  endDate: string | null,
  estimateHours: number | null
): Map<string, number> {
  const map = new Map<string, number>()
  if (!startDate || !endDate) return map
  const working = eachWorkingDay(startDate, endDate)
  if (working.length === 0) return map

  const totalMinutes =
    estimateHours != null && estimateHours > 0
      ? Math.round(estimateHours * 60)
      : working.length * MINUTES_PER_DAY

  const base = Math.floor(totalMinutes / working.length)
  let remainder = totalMinutes - base * working.length
  for (const day of working) {
    const extra = remainder > 0 ? 1 : 0
    if (remainder > 0) remainder -= 1
    map.set(day, base + extra)
  }
  return map
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

export function buildBucketsForRow(
  columns: TimelineColumn[],
  startDate: string | null,
  endDate: string | null,
  estimateHours: number | null,
  options?: {
    taskId?: string | null
    snapshots?: TaskProgressSnapshot[]
    manualAllocation?: TaskAllocationPlan | null
  }
): TimelineBucketCell[] {
  const taskId = options?.taskId ?? null
  const snapshots = options?.snapshots ?? []

  if (!startDate || !endDate) {
    return columns.map((col) => ({
      periodStart: col.periodStart,
      periodEnd: col.periodEnd,
      plannedMinutes: 0,
      plannedContributionPercent: null,
      cumulativePlannedPercent: null,
      actualProgressPercent: null,
      variancePercent: null,
      occupancyPercent: null,
      actualIsCarryForward: false,
      scheduled: false,
    }))
  }

  const daily = resolveDailyAllocationMinutes(
    startDate,
    endDate,
    estimateHours,
    options?.manualAllocation
  )
  const totalPlanned = [...daily.values()].reduce((s, m) => s + m, 0)
  const hasEstimate = estimateHours != null && estimateHours > 0

  let cumulative = 0
  return columns.map((col) => {
    let plannedMinutes = 0
    for (const [day, minutes] of daily) {
      if (day >= col.periodStart && day <= col.periodEnd) {
        plannedMinutes += minutes
      }
    }
    const scheduled = rangesOverlap(startDate, endDate, col.periodStart, col.periodEnd)
    cumulative += plannedMinutes
    const cumulativePlannedPercent =
      hasEstimate && totalPlanned > 0
        ? Math.round((cumulative / totalPlanned) * 1000) / 10
        : null

    const actualHit =
      taskId && scheduled
        ? resolveActualProgressAsOf(snapshots, taskId, col.periodEnd)
        : null

    const actualProgressPercent = actualHit?.percent ?? null
    return {
      periodStart: col.periodStart,
      periodEnd: col.periodEnd,
      plannedMinutes,
      plannedContributionPercent:
        hasEstimate && totalPlanned > 0
          ? Math.round((plannedMinutes / totalPlanned) * 1000) / 10
          : null,
      cumulativePlannedPercent,
      actualProgressPercent,
      variancePercent: variancePercent(actualProgressPercent, cumulativePlannedPercent),
      occupancyPercent: plannedMinutes > 0 ? occupancyPercent(plannedMinutes) : null,
      actualIsCarryForward: actualHit?.isCarryForward ?? false,
      scheduled: scheduled && plannedMinutes > 0 ? true : scheduled,
    }
  })
}

export function cellWidthPx(granularity: Granularity): number {
  /** Day +10px (44→54) — clearer month context without +20 bloat. */
  if (granularity === TimelineGranularity.Day) return 54
  if (granularity === TimelineGranularity.Week) return 100
  if (granularity === TimelineGranularity.Quarter) return 160
  return 128
}
