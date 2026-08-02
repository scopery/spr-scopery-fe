import type { GanttItem } from '../model/gantt'
import { TimelineGranularity } from '../enums/timeline.enum'
import type { TimelineGranularity as Granularity } from '../enums/timeline.enum'
import {
  addLocalDays,
  formatLocalDate,
  maxDateOnly,
  minDateOnly,
  parseLocalDate,
  todayLocal,
} from './working-calendar.rules'

export function resolveTimelineViewport(
  items: GanttItem[],
  options?: { padDays?: number }
): { start: string; end: string } {
  const pad = options?.padDays ?? 7
  let min: string | null = null
  let max: string | null = null

  for (const item of items) {
    if (item.startDate) {
      min = min == null ? item.startDate.slice(0, 10) : minDateOnly(min, item.startDate.slice(0, 10))
    }
    if (item.endDate) {
      max = max == null ? item.endDate.slice(0, 10) : maxDateOnly(max, item.endDate.slice(0, 10))
    }
  }

  const today = formatLocalDate(todayLocal())
  if (!min || !max) {
    const t = todayLocal()
    return {
      start: formatLocalDate(addLocalDays(t, -pad)),
      end: formatLocalDate(addLocalDays(t, 30)),
    }
  }

  const startD = parseLocalDate(min)!
  const endD = parseLocalDate(max)!
  let start = formatLocalDate(addLocalDays(startD, -pad))
  let end = formatLocalDate(addLocalDays(endD, pad))

  // Ensure today is visible when work span is short
  if (today < start) start = formatLocalDate(addLocalDays(parseLocalDate(today)!, -pad))
  if (today > end) end = formatLocalDate(addLocalDays(parseLocalDate(today)!, pad))

  return { start, end }
}

export function pickFitGranularity(start: string, end: string): Granularity {
  const s = parseLocalDate(start)
  const e = parseLocalDate(end)
  if (!s || !e) return TimelineGranularity.Week
  const days =
    Math.round((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1
  if (days <= 21) return TimelineGranularity.Day
  if (days <= 90) return TimelineGranularity.Week
  return TimelineGranularity.Month
}

/** Center viewport around today with roughly `spanDays` visible. */
export function viewportAroundToday(spanDays = 28): { start: string; end: string } {
  const t = todayLocal()
  const half = Math.floor(spanDays / 2)
  return {
    start: formatLocalDate(addLocalDays(t, -half)),
    end: formatLocalDate(addLocalDays(t, spanDays - half)),
  }
}
