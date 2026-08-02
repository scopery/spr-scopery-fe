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

export function selectTaskRowRange(
  taskRows: TimelineFlatRow[],
  fromId: string,
  toId: string
): string[] {
  const fromIdx = taskRows.findIndex((r) => r.id === fromId)
  const toIdx = taskRows.findIndex((r) => r.id === toId)
  if (fromIdx < 0 || toIdx < 0) return [toId]
  const a = Math.min(fromIdx, toIdx)
  const b = Math.max(fromIdx, toIdx)
  return taskRows.slice(a, b + 1).map((r) => r.id)
}
