import type { GanttItem, GanttTreeItem } from '../model/gantt'

/** Build a parent/child tree from the flat Gantt items list (`parentItemId`). */
export function buildGanttTree(items: GanttItem[]): GanttTreeItem[] {
  const byId = new Map<string, GanttTreeItem>()
  for (const item of items) {
    byId.set(item.id, { ...item, children: [] })
  }

  const roots: GanttTreeItem[] = []
  for (const item of items) {
    const treeItem = byId.get(item.id)
    if (!treeItem) continue
    if (item.parentItemId && byId.has(item.parentItemId)) {
      byId.get(item.parentItemId)!.children.push(treeItem)
    } else {
      roots.push(treeItem)
    }
  }

  const sortRecursive = (list: GanttTreeItem[]) => {
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    list.forEach((item) => sortRecursive(item.children))
  }
  sortRecursive(roots)

  return roots
}

export interface GanttDateRange {
  startMs: number
  endMs: number
}

/** Compute the overall [min start, max end] range across all scheduled items. */
export function computeGanttDateRange(items: GanttItem[]): GanttDateRange | null {
  let startMs: number | null = null
  let endMs: number | null = null

  for (const item of items) {
    if (item.startDate) {
      const ms = new Date(item.startDate).getTime()
      if (!Number.isNaN(ms) && (startMs === null || ms < startMs)) startMs = ms
    }
    if (item.endDate) {
      const ms = new Date(item.endDate).getTime()
      if (!Number.isNaN(ms) && (endMs === null || ms > endMs)) endMs = ms
    }
  }

  if (startMs === null || endMs === null) return null
  if (endMs <= startMs) endMs = startMs + 24 * 60 * 60 * 1000

  return { startMs, endMs }
}

/** Compute left/width percentages to position a bar within the given date range. */
export function computeBarStyle(
  item: GanttItem,
  range: GanttDateRange
): { leftPercent: number; widthPercent: number } | null {
  if (!item.startDate) return null
  const startMs = new Date(item.startDate).getTime()
  if (Number.isNaN(startMs)) return null
  const endMs = item.endDate ? new Date(item.endDate).getTime() : startMs
  const totalMs = range.endMs - range.startMs
  if (totalMs <= 0) return { leftPercent: 0, widthPercent: 100 }

  const leftPercent = ((startMs - range.startMs) / totalMs) * 100
  const widthPercent = Math.max(((endMs - startMs) / totalMs) * 100, 0.6)

  return {
    leftPercent: Math.min(Math.max(leftPercent, 0), 100),
    widthPercent: Math.min(widthPercent, 100 - Math.min(Math.max(leftPercent, 0), 100)),
  }
}

export function ganttItemBarTone(item: GanttItem): 'primary' | 'neutral' | 'warning' {
  if (item.scheduleStatus === 'UNSCHEDULED') return 'neutral'
  if (item.scheduleStatus === 'AT_RISK' || item.scheduleStatus === 'DELAYED') return 'warning'
  return 'primary'
}

export function ganttItemTypeLabel(itemType: string): string {
  switch (itemType) {
    case 'PHASE':
      return 'Phase'
    case 'TASK':
      return 'Task'
    case 'MILESTONE':
      return 'Milestone'
    case 'WBS_NODE':
      return 'WBS'
    case 'PROJECT':
      return 'Project'
    default:
      return itemType
  }
}

export type GanttTimeScale = 'day' | 'week' | 'month'

export interface GanttScaleTick {
  key: string
  label: string
  subLabel?: string
  leftPercent: number
  widthPercent: number
  isWeekend?: boolean
  major?: boolean
}

/** Normalize API / ISO date strings to YYYY-MM-DD. */
export function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
  return m ? m[1] : null
}

export function formatGanttDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = toDateOnly(value)
  if (!d) return value
  const [y, mo, day] = d.split('-').map(Number)
  const date = new Date(y, mo - 1, day)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString()
}

/** Inclusive day count between start and end (both YYYY-MM-DD). */
export function durationDays(
  start: string | null | undefined,
  end: string | null | undefined
): number | null {
  const s = toDateOnly(start)
  const e = toDateOnly(end ?? start)
  if (!s || !e) return null
  const a = new Date(`${s}T12:00:00`).getTime()
  const b = new Date(`${e}T12:00:00`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.max(1, Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1)
}
