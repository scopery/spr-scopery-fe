import { toDateOnly } from './gantt.rules'
import type { GanttItem } from '../model/gantt'

/** Soft cap so Excel stays usable for long projects. */
export const GANTT_EXCEL_MAX_DAY_COLUMNS = 120

export type GanttExcelChartScale = 'day' | 'week'

export interface GanttExcelChartColumn {
  /** Inclusive start YYYY-MM-DD */
  start: string
  /** Inclusive end YYYY-MM-DD (same as start for day scale) */
  end: string
  label: string
}

export interface FlattenedGanttExcelRow {
  item: GanttItem
  depth: number
}

export function flattenGanttItemsForExport(items: GanttItem[]): FlattenedGanttExcelRow[] {
  const out: FlattenedGanttExcelRow[] = []
  const walk = (list: GanttItem[], depth: number) => {
    for (const item of list) {
      out.push({ item, depth })
      if (item.children?.length) walk(item.children, depth + 1)
    }
  }
  walk(items, 0)
  return out
}

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(dateOnly: string, days: number): string {
  const d = parseDateOnly(dateOnly)
  d.setDate(d.getDate() + days)
  return formatDateOnly(d)
}

function dayDiffInclusive(start: string, end: string): number {
  const a = parseDateOnly(start).getTime()
  const b = parseDateOnly(end).getTime()
  return Math.max(1, Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1)
}

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

function shortDayLabel(dateOnly: string): string {
  const d = parseDateOnly(dateOnly)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/**
 * Build a contiguous day or week axis covering scheduled items.
 * Falls back to week scale when the span would exceed `maxDayColumns`.
 */
export function buildGanttExcelChartColumns(
  items: FlattenedGanttExcelRow[],
  maxDayColumns: number = GANTT_EXCEL_MAX_DAY_COLUMNS
): { scale: GanttExcelChartScale; columns: GanttExcelChartColumn[] } {
  let min: string | null = null
  let max: string | null = null

  for (const { item } of items) {
    const start = toDateOnly(item.startDate)
    const end = toDateOnly(item.endDate ?? item.startDate)
    if (!start) continue
    const finish = end && end >= start ? end : start
    if (!min || start < min) min = start
    if (!max || finish > max) max = finish
  }

  if (!min || !max) {
    return { scale: 'day', columns: [] }
  }

  // Small pad so bars are not glued to edges
  min = addDays(min, -1)
  max = addDays(max, 1)

  const span = dayDiffInclusive(min, max)
  if (span <= maxDayColumns) {
    const columns: GanttExcelChartColumn[] = []
    let cursor = min
    while (cursor <= max) {
      columns.push({ start: cursor, end: cursor, label: shortDayLabel(cursor) })
      cursor = addDays(cursor, 1)
    }
    return { scale: 'day', columns }
  }

  // Week buckets (Mon–Sun-ish: 7-day chunks from min)
  const columns: GanttExcelChartColumn[] = []
  let cursor = min
  while (cursor <= max) {
    const weekEnd = addDays(cursor, 6)
    const end = weekEnd > max ? max : weekEnd
    columns.push({
      start: cursor,
      end,
      label: `${shortDayLabel(cursor)}`,
    })
    cursor = addDays(end, 1)
  }
  return { scale: 'week', columns }
}

export function itemOverlapsChartColumn(
  item: GanttItem,
  column: GanttExcelChartColumn
): boolean {
  const start = toDateOnly(item.startDate)
  if (!start) return false
  const endRaw = toDateOnly(item.endDate ?? item.startDate)
  const end = endRaw && endRaw >= start ? endRaw : start
  return rangesOverlap(start, end, column.start, column.end)
}

/** Hex fills for Excel cell background (ARGB without alpha prefix for ExcelJS). */
export function ganttExcelBarFillHex(item: GanttItem): string {
  const status = (item.scheduleStatus ?? '').toUpperCase()
  if (status === 'UNSCHEDULED') return 'D4D4D8' // zinc-300
  if (status === 'AT_RISK' || status === 'DELAYED') return 'F59E0B' // amber-500
  switch ((item.itemType ?? '').toUpperCase()) {
    case 'PHASE':
    case 'PROJECT':
    case 'WBS_NODE':
      return '64748B' // slate-500
    case 'MILESTONE':
      return '8B5CF6' // violet-500
    case 'TASK':
    default:
      return '60A5FA' // blue-400
  }
}
