/** Local date helpers + Mon–Fri working calendar (holidays later). */

const DAY_MS = 24 * 60 * 60 * 1000

export function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

export function addLocalDays(d: Date, days: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + days)
  return x
}

export function todayLocal(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function isWorkingDay(d: Date): boolean {
  return !isWeekend(d)
}

export function compareDateOnly(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function minDateOnly(a: string, b: string): string {
  return compareDateOnly(a, b) <= 0 ? a : b
}

export function maxDateOnly(a: string, b: string): string {
  return compareDateOnly(a, b) >= 0 ? a : b
}

export function inclusiveCalendarDays(start: string, end: string): number {
  const s = parseLocalDate(start)
  const e = parseLocalDate(end)
  if (!s || !e) return 0
  const a = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate())
  const b = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate())
  return Math.max(1, Math.round((b - a) / DAY_MS) + 1)
}

/** Inclusive list of calendar dates from start to end (YYYY-MM-DD). */
export function eachCalendarDay(start: string, end: string): string[] {
  const s = parseLocalDate(start)
  const e = parseLocalDate(end)
  if (!s || !e || e < s) return []
  const out: string[] = []
  let cur = s
  while (cur <= e) {
    out.push(formatLocalDate(cur))
    cur = addLocalDays(cur, 1)
  }
  return out
}

export function eachWorkingDay(start: string, end: string): string[] {
  return eachCalendarDay(start, end).filter((iso) => {
    const d = parseLocalDate(iso)
    return d ? isWorkingDay(d) : false
  })
}

export function countWorkingDays(start: string, end: string): number {
  return eachWorkingDay(start, end).length
}

/** Shift a date range by N calendar days (preserves inclusive span). */
export function shiftDateRange(
  start: string,
  end: string,
  deltaDays: number
): { start: string; end: string } {
  const s = parseLocalDate(start)
  const e = parseLocalDate(end)
  if (!s || !e) return { start, end }
  return {
    start: formatLocalDate(addLocalDays(s, deltaDays)),
    end: formatLocalDate(addLocalDays(e, deltaDays)),
  }
}

/** Add/subtract working days from a date (skips weekends). */
export function addWorkingDays(from: string, workingDays: number): string {
  const d = parseLocalDate(from)
  if (!d) return from
  if (workingDays === 0) return from
  const step = workingDays > 0 ? 1 : -1
  let remaining = Math.abs(workingDays)
  let cur = d
  while (remaining > 0) {
    cur = addLocalDays(cur, step)
    if (isWorkingDay(cur)) remaining -= 1
  }
  return formatLocalDate(cur)
}

export function startOfWeekMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addLocalDays(d, diff)
}

export function endOfWeekSunday(d: Date): Date {
  return addLocalDays(startOfWeekMonday(d), 6)
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
