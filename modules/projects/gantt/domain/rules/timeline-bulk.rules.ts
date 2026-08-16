import type { TimelineFlatRow } from '../model/timeline'
import {
  addWorkingDays,
  countWorkingDays,
  formatLocalDate,
  todayLocal,
} from './working-calendar.rules'

export type FillScheduleMode = 'copy' | 'sequential' | 'same_duration'

export interface SchedulePatch {
  itemId: string
  sourceTaskId: string
  startDate: string
  endDate: string
}

export function workingDurationDays(row: TimelineFlatRow): number {
  if (row.startDate && row.endDate) {
    return Math.max(1, countWorkingDays(row.startDate, row.endDate))
  }
  if (row.estimateHours != null && row.estimateHours > 0) {
    return Math.max(1, Math.ceil(row.estimateHours / 8))
  }
  return 1
}

export function shiftRangeByWorkingDays(
  start: string,
  end: string,
  deltaWorkingDays: number
): { startDate: string; endDate: string } {
  const span = Math.max(1, countWorkingDays(start, end))
  const startDate = addWorkingDays(start, deltaWorkingDays)
  const endDate = addWorkingDays(startDate, span - 1)
  return { startDate, endDate }
}

/** Lay out tasks back-to-back on working days starting at `anchorStart`. */
export function scheduleSequentially(
  rows: TimelineFlatRow[],
  anchorStart: string
): SchedulePatch[] {
  const patches: SchedulePatch[] = []
  let cursor = anchorStart
  for (const row of rows) {
    if (!row.sourceEntityId || row.kind !== 'task') continue
    const days = workingDurationDays(row)
    const startDate = cursor
    const endDate = addWorkingDays(startDate, days - 1)
    patches.push({
      itemId: row.id,
      sourceTaskId: row.sourceEntityId,
      startDate,
      endDate,
    })
    cursor = addWorkingDays(endDate, 1)
  }
  return patches
}

/** All tasks share the same start; each keeps its own duration. */
export function scheduleInParallel(
  rows: TimelineFlatRow[],
  anchorStart: string
): SchedulePatch[] {
  const patches: SchedulePatch[] = []
  for (const row of rows) {
    if (!row.sourceEntityId || row.kind !== 'task') continue
    const days = workingDurationDays(row)
    patches.push({
      itemId: row.id,
      sourceTaskId: row.sourceEntityId,
      startDate: anchorStart,
      endDate: addWorkingDays(anchorStart, days - 1),
    })
  }
  return patches
}

export function applyFillHandle(
  source: TimelineFlatRow,
  targets: TimelineFlatRow[],
  mode: FillScheduleMode
): SchedulePatch[] {
  if (!source.sourceEntityId || !source.startDate || !source.endDate) return []

  if (mode === 'copy') {
    return targets
      .filter((t) => t.kind === 'task' && t.sourceEntityId)
      .map((t) => ({
        itemId: t.id,
        sourceTaskId: t.sourceEntityId!,
        startDate: source.startDate!,
        endDate: source.endDate!,
      }))
  }

  if (mode === 'same_duration') {
    const days = workingDurationDays(source)
    return targets
      .filter((t) => t.kind === 'task' && t.sourceEntityId)
      .map((t) => {
        const start = t.startDate ?? source.startDate!
        return {
          itemId: t.id,
          sourceTaskId: t.sourceEntityId!,
          startDate: start,
          endDate: addWorkingDays(start, days - 1),
        }
      })
  }

  // sequential starting the day after the source ends
  const afterSource = addWorkingDays(source.endDate, 1)
  return scheduleSequentially(targets, afterSource)
}

export function defaultAnchorStart(rows: TimelineFlatRow[]): string {
  for (const row of rows) {
    if (row.startDate) return row.startDate
  }
  return formatLocalDate(todayLocal())
}

/** Parse pasted plain text into task title lines (and optional TSV columns). */
export function parsePastedTaskLines(text: string): Array<{
  title: string
  startDate?: string
  endDate?: string
  estimateRaw?: string
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.map((line) => {
    const parts = line.split('\t').map((p) => p.trim())
    if (parts.length >= 3) {
      return {
        title: parts[0],
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(parts[1]) ? parts[1] : undefined,
        endDate: /^\d{4}-\d{2}-\d{2}$/.test(parts[2]) ? parts[2] : undefined,
        estimateRaw: parts[3],
      }
    }
    return { title: parts[0] }
  })
}

export function selectRowRange(
  rows: TimelineFlatRow[],
  fromId: string,
  toId: string
): string[] {
  const fromIdx = rows.findIndex((r) => r.id === fromId)
  const toIdx = rows.findIndex((r) => r.id === toId)
  if (fromIdx < 0 || toIdx < 0) return [toId]
  const a = Math.min(fromIdx, toIdx)
  const b = Math.max(fromIdx, toIdx)
  return rows.slice(a, b + 1).map((r) => r.id)
}

/** @deprecated Use selectRowRange — kept for existing call sites. */
export function selectTaskRowRange(
  taskRows: TimelineFlatRow[],
  fromId: string,
  toId: string
): string[] {
  return selectRowRange(taskRows, fromId, toId)
}

export function isShiftableTimelineRow(row: TimelineFlatRow): boolean {
  if (!row.startDate || !row.endDate) return false
  if (row.kind === 'task' || row.kind === 'milestone') return Boolean(row.sourceEntityId)
  return (
    row.kind === 'phase' &&
    (row.itemType === 'PHASE' || row.itemType === 'WBS_NODE' || row.itemType === 'PROJECT')
  )
}

export function isContainerTimelineRow(row: TimelineFlatRow): boolean {
  return (
    row.kind === 'phase' &&
    (row.itemType === 'PHASE' || row.itemType === 'WBS_NODE' || row.itemType === 'PROJECT')
  )
}

/** Visible descendants after `parentId` until the next sibling/ancestor. */
export function collectDescendantFlatRows(
  rows: TimelineFlatRow[],
  parentId: string
): TimelineFlatRow[] {
  const idx = rows.findIndex((r) => r.id === parentId)
  if (idx < 0) return []
  const parent = rows[idx]
  const out: TimelineFlatRow[] = []
  for (let i = idx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.depth <= parent.depth) break
    if (row.kind === 'add') continue
    out.push(row)
  }
  return out
}

/**
 * Shift selected rows by working days. Selecting a phase / WBS / project
 * also shifts scheduled descendants so the subtree stays aligned.
 */
export function buildShiftPatches(
  rows: TimelineFlatRow[],
  selectedIds: Iterable<string>,
  deltaWorkingDays: number
): SchedulePatch[] {
  if (deltaWorkingDays === 0) return []
  const selected = new Set(selectedIds)
  const targets = new Map<string, TimelineFlatRow>()

  for (const row of rows) {
    if (!selected.has(row.id)) continue
    if (isShiftableTimelineRow(row)) targets.set(row.id, row)
    if (isContainerTimelineRow(row)) {
      for (const child of collectDescendantFlatRows(rows, row.id)) {
        if (isShiftableTimelineRow(child)) targets.set(child.id, child)
      }
    }
  }

  return [...targets.values()].map((row) => {
    const next = shiftRangeByWorkingDays(row.startDate!, row.endDate!, deltaWorkingDays)
    return {
      itemId: row.id,
      sourceTaskId: row.sourceEntityId ?? row.id,
      ...next,
    }
  })
}

/** Root plus visible descendants — used when checking a phase / WBS. */
export function collectSelectableSubtreeIds(
  rows: TimelineFlatRow[],
  rootId: string
): string[] {
  const root = rows.find((r) => r.id === rootId)
  if (!root || root.kind === 'add') return []
  if (!isContainerTimelineRow(root)) return [rootId]
  return [rootId, ...collectDescendantFlatRows(rows, rootId).map((r) => r.id)]
}

export function summarizeTimelineSelection(rows: TimelineFlatRow[]): string {
  let phases = 0
  let wbs = 0
  let projects = 0
  let tasks = 0
  for (const row of rows) {
    if (row.itemType === 'PHASE') phases += 1
    else if (row.itemType === 'WBS_NODE') wbs += 1
    else if (row.itemType === 'PROJECT') projects += 1
    else if (row.kind === 'task' || row.kind === 'milestone') tasks += 1
  }
  const parts: string[] = []
  if (projects) parts.push(`${projects} project${projects === 1 ? '' : 's'}`)
  if (phases) parts.push(`${phases} phase${phases === 1 ? '' : 's'}`)
  if (wbs) parts.push(`${wbs} planning element${wbs === 1 ? '' : 's'}`)
  if (tasks) parts.push(`${tasks} task${tasks === 1 ? '' : 's'}`)
  if (parts.length === 0) return `${rows.length} selected`
  return `${parts.join(' · ')} selected`
}
