/** Soft cap so Excel stays usable for long date spans. */
export const TIMELINE_EXCEL_MAX_DAY_COLUMNS = 120

export type TimelineExcelChartScale = 'day' | 'week'

export interface TimelineExcelChartColumn {
  /** Inclusive start YYYY-MM-DD */
  start: string
  /** Inclusive end YYYY-MM-DD (same as start for day scale) */
  end: string
  label: string
}

export interface TimelineExcelDateSpan {
  startDate: string | null | undefined
  endDate: string | null | undefined
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

/** Normalize to YYYY-MM-DD when possible. */
export function toExcelDateOnly(value: string | null | undefined): string | null {
  if (!value) return null
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
  return m ? m[1] : null
}

function spanBounds(span: TimelineExcelDateSpan): { start: string; end: string } | null {
  const start = toExcelDateOnly(span.startDate)
  if (!start) return null
  const endRaw = toExcelDateOnly(span.endDate ?? span.startDate)
  const end = endRaw && endRaw >= start ? endRaw : start
  return { start, end }
}

/**
 * Build a contiguous day or week axis covering scheduled spans.
 * Falls back to week scale when the span would exceed `maxDayColumns`.
 */
export function buildTimelineExcelChartColumns(
  spans: TimelineExcelDateSpan[],
  maxDayColumns: number = TIMELINE_EXCEL_MAX_DAY_COLUMNS
): { scale: TimelineExcelChartScale; columns: TimelineExcelChartColumn[] } {
  let min: string | null = null
  let max: string | null = null

  for (const span of spans) {
    const bounds = spanBounds(span)
    if (!bounds) continue
    if (!min || bounds.start < min) min = bounds.start
    if (!max || bounds.end > max) max = bounds.end
  }

  if (!min || !max) {
    return { scale: 'day', columns: [] }
  }

  min = addDays(min, -1)
  max = addDays(max, 1)

  const span = dayDiffInclusive(min, max)
  if (span <= maxDayColumns) {
    const columns: TimelineExcelChartColumn[] = []
    let cursor = min
    while (cursor <= max) {
      columns.push({ start: cursor, end: cursor, label: shortDayLabel(cursor) })
      cursor = addDays(cursor, 1)
    }
    return { scale: 'day', columns }
  }

  const columns: TimelineExcelChartColumn[] = []
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

export function spanOverlapsChartColumn(
  span: TimelineExcelDateSpan,
  column: TimelineExcelChartColumn
): boolean {
  const bounds = spanBounds(span)
  if (!bounds) return false
  return rangesOverlap(bounds.start, bounds.end, column.start, column.end)
}

/** Inclusive day count between start and end. */
export function excelDurationDays(
  start: string | null | undefined,
  end: string | null | undefined
): number | null {
  const s = toExcelDateOnly(start)
  const e = toExcelDateOnly(end ?? start)
  if (!s || !e) return null
  return dayDiffInclusive(s, e)
}

export function formatExcelExportTimestamp(iso = new Date().toISOString()): string {
  const d = toExcelDateOnly(iso) ?? iso.slice(0, 10)
  const [y, mo, day] = d.split('-').map(Number)
  const date = new Date(y, mo - 1, day)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString()
}
