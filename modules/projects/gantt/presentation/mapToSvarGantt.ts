import type { ILink, ITask } from '@svar-ui/react-gantt'
import type { GanttDependency, GanttTreeItem } from '../domain/model/gantt'
import { toDateOnly } from '../domain/rules/gantt.rules'

const DAY_MS = 24 * 60 * 60 * 1000

/** Parse YYYY-MM-DD (or ISO) as local midnight — avoids UTC off-by-one. */
function parseLocalDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!m) return undefined
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? undefined : d
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function addLocalDays(d: Date, days: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + days)
  return x
}

function inclusiveDaySpan(start: Date, end: Date): number {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.max(1, Math.round((b - a) / DAY_MS) + 1)
}

function mapItemType(itemType: string): ITask['type'] {
  if (itemType === 'MILESTONE') return 'milestone'
  if (itemType === 'TASK') return 'task'
  return 'summary'
}

/** Scan tree for any real schedule dates; fallback = today → +30d. */
function resolveFallbackRange(tree: GanttTreeItem[]): { start: Date; end: Date } {
  let min: Date | undefined
  let max: Date | undefined

  const visit = (nodes: GanttTreeItem[]) => {
    for (const n of nodes) {
      const s = parseLocalDate(n.startDate)
      const e = parseLocalDate(n.endDate ?? n.startDate)
      if (s && (!min || s < min)) min = s
      if (e && (!max || e > max)) max = e
      if (n.children.length) visit(n.children)
    }
  }
  visit(tree)

  if (min && max) {
    if (max < min) max = addLocalDays(min, 0)
    return { start: min, end: max }
  }
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return { start, end: addLocalDays(start, 30) }
}

function rollupFromSlice(
  tasks: ITask[],
  from: number,
  to: number
): { start: Date; duration: number } | null {
  let min: Date | undefined
  let maxExclusive: Date | undefined
  for (let i = from; i < to; i++) {
    const t = tasks[i]
    if (!t?.start || typeof t.duration !== 'number' || t.duration < 1) continue
    const endEx = addLocalDays(t.start, t.duration)
    if (!min || t.start < min) min = t.start
    if (!maxExclusive || endEx > maxExclusive) maxExclusive = endEx
  }
  if (!min || !maxExclusive) return null
  const inclusiveEnd = addLocalDays(maxExclusive, -1)
  return { start: min, duration: inclusiveDaySpan(min, inclusiveEnd) }
}

/**
 * Flatten tree → SVAR tasks.
 *
 * SVAR rule: set either `end` OR `duration`, not both.
 * SVAR `end` is exclusive (start + duration). BE dates are inclusive.
 * We only pass `start` + `duration` (inclusive day count).
 */
export function mapGanttTreeToSvarTasks(
  tree: GanttTreeItem[],
  opts?: { includeUnscheduled?: boolean }
): ITask[] {
  const includeUnscheduled = opts?.includeUnscheduled ?? true
  const fallback = resolveFallbackRange(tree)
  const out: ITask[] = []

  const walk = (nodes: GanttTreeItem[], parentId: string | number = 0) => {
    for (const node of nodes) {
      const isTask = node.itemType === 'TASK'
      const ownStart = parseLocalDate(node.startDate)
      const ownEnd = parseLocalDate(node.endDate ?? node.startDate)
      const unscheduled = !ownStart

      if (isTask) {
        if (unscheduled && !includeUnscheduled) continue

        const start = ownStart ?? fallback.start
        const duration = ownStart
          ? inclusiveDaySpan(ownStart, ownEnd ?? ownStart)
          : 1

        out.push({
          id: node.id,
          text: unscheduled ? `${node.title} (unscheduled)` : node.title,
          type: 'task',
          parent: parentId,
          progress: 0,
          start,
          duration,
          sourceEntityId: node.sourceEntityId,
          sourceEntityType: node.sourceEntityType,
          itemType: node.itemType,
          isPlaceholderSchedule: unscheduled,
        })
        continue
      }

      const insertAt = out.length
      walk(node.children, node.id)
      const childCount = out.length - insertAt
      const rolled = rollupFromSlice(out, insertAt, out.length)

      const start = ownStart ?? rolled?.start ?? fallback.start
      const duration = ownStart
        ? inclusiveDaySpan(ownStart, ownEnd ?? ownStart)
        : (rolled?.duration ?? inclusiveDaySpan(fallback.start, fallback.end))

      const task: ITask = {
        id: node.id,
        text: node.title,
        type: mapItemType(node.itemType),
        parent: parentId,
        progress: 0,
        start,
        duration,
        sourceEntityId: node.sourceEntityId,
        sourceEntityType: node.sourceEntityType,
        itemType: node.itemType,
        isPlaceholderSchedule: !ownStart && !rolled,
      }

      if (childCount > 0) task.open = true

      out.splice(insertAt, 0, task)
    }
  }

  walk(tree)
  return out
}

export function mapGanttDepsToSvarLinks(
  deps: GanttDependency[],
  tasks: ITask[]
): ILink[] {
  const ids = new Set(tasks.map((t) => String(t.id)))
  const typeMap: Record<string, ILink['type']> = {
    FINISH_TO_START: 'e2s',
    START_TO_START: 's2s',
    FINISH_TO_FINISH: 'e2e',
    START_TO_FINISH: 's2e',
    FS: 'e2s',
    SS: 's2s',
    FF: 'e2e',
    SF: 's2e',
  }

  return deps
    .map((d, i) => {
      const source = `TASK:${d.predecessorTaskId}`
      const target = `TASK:${d.successorTaskId}`
      return {
        id: d.id || i + 1,
        source,
        target,
        type: typeMap[d.dependencyType] ?? ('e2s' as const),
      }
    })
    .filter((l) => ids.has(String(l.source)) && ids.has(String(l.target)))
}

/** Only leaf TASK rows can be dragged on the chart. Phase/WBS/Project are rollups. */
export function isGanttChartDraggable(task: {
  type?: string
  itemType?: string
}): boolean {
  return task.itemType === 'TASK' || task.type === 'task'
}

export function ganttDragHintForItemType(itemType: string): string | null {
  if (itemType === 'TASK') return null
  if (itemType === 'PHASE') return 'Phase dates rollup from child tasks'
  if (itemType === 'WBS_NODE') return 'WBS dates rollup from tasks in this node'
  if (itemType === 'PROJECT') return 'Project bar is a rollup of the whole plan'
  if (itemType === 'MILESTONE') return 'Edit milestone date from the milestone record'
  return 'This row is read-only on the timeline'
}

/** Resolve BE task UUID from a SVAR task id / custom field. */
export function resolveSourceTaskId(task: ITask): string | null {
  if (task.sourceEntityType === 'TASK' && typeof task.sourceEntityId === 'string') {
    return task.sourceEntityId
  }
  if (typeof task.id === 'string' && task.id.startsWith('TASK:')) {
    return task.id.slice(5)
  }
  return null
}

export function toDateOnlyFromSvar(date: Date | undefined): string | null {
  if (!date) return null
  return formatLocalDate(date)
}

/**
 * SVAR stores exclusive `end` (= start + duration).
 * BE / UI use inclusive finish (= last day of work).
 */
export function toInclusiveFinishFromSvar(task: ITask): string | null {
  if (!task.start) return null
  if (typeof task.duration === 'number' && task.duration >= 1) {
    return formatLocalDate(addLocalDays(task.start, task.duration - 1))
  }
  if (task.end) {
    return formatLocalDate(addLocalDays(task.end, -1))
  }
  return formatLocalDate(task.start)
}

/** Format inclusive finish for grid End column (SVAR value is exclusive). */
export function formatInclusiveEndForGrid(
  exclusiveEnd: unknown,
  row: { start?: Date; duration?: number }
): string {
  if (row.start && typeof row.duration === 'number' && row.duration >= 1) {
    return formatLocalDate(addLocalDays(row.start, row.duration - 1))
  }
  if (exclusiveEnd instanceof Date && !Number.isNaN(exclusiveEnd.getTime())) {
    return formatLocalDate(addLocalDays(exclusiveEnd, -1))
  }
  return '—'
}

export function formatStartForGrid(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDate(value)
  }
  if (typeof value === 'string' && value) return toDateOnly(value) || value
  return '—'
}
