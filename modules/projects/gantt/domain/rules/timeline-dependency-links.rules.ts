import type { GanttDependency } from '../model/gantt'
import type { TimelineColumn, TimelineFlatRow } from '../model/timeline'
import { buildBucketSegment } from './bucket-segment.rules'
import { timelineRowHeight } from '../model/timeline-layout'

export interface TimelineDependencyPath {
  id: string
  d: string
  dependencyType: string
}

/** Pixel range of a schedule bar across the column strip. */
export function computeBarPixelRange(
  startDate: string,
  endDate: string,
  columns: TimelineColumn[],
  colWidth: number
): { left: number; right: number } | null {
  let left: number | null = null
  let right: number | null = null
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]
    if (!col) continue
    // Columns are chronological — skip / stop early for Day zoom with long ranges.
    if (col.periodEnd < startDate) continue
    if (col.periodStart > endDate) break
    const seg = buildBucketSegment(startDate, endDate, col.periodStart, col.periodEnd)
    if (!seg) continue
    const x0 = i * colWidth + seg.startRatio * colWidth
    const x1 = i * colWidth + seg.endRatio * colWidth
    if (left === null) left = x0
    right = x1
  }
  if (left === null || right === null) return null
  return { left, right }
}

function rowCenters(rows: TimelineFlatRow[]): Map<string, number> {
  const centers = new Map<string, number>()
  let y = 0
  for (const row of rows) {
    const h = timelineRowHeight(row.kind, row.itemType)
    if (row.kind === 'task' && row.sourceEntityId && row.startDate && row.endDate) {
      centers.set(row.sourceEntityId, y + h / 2)
    }
    y += h
  }
  return centers
}

type AnchorSide = 'left' | 'right'

const STUB = 14

function r(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Orthogonal Gantt-style link routing (MS Project / dhtmlx pattern).
 * Handles forward, tight/adjacent, and reverse layouts for all 4 sides.
 */
function elbowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fromSide: AnchorSide,
  toSide: AnchorSide
): string {
  const sx = r(x1)
  const sy = r(y1)
  const tx = r(x2)
  const ty = r(y2)
  const sameRow = Math.abs(ty - sy) < 1

  const exitX = fromSide === 'right' ? sx + STUB : sx - STUB
  const entryX = toSide === 'left' ? tx - STUB : tx + STUB

  // Same row: keep a shallow bump so reverse links stay readable.
  if (sameRow) {
    if (fromSide === 'right' && toSide === 'left' && tx >= sx + STUB) {
      return `M ${sx} ${sy} H ${tx}`
    }
    if (fromSide === 'left' && toSide === 'right' && tx <= sx - STUB) {
      return `M ${sx} ${sy} H ${tx}`
    }
    const bump = sy + (fromSide === toSide ? -18 : 18)
    return `M ${sx} ${sy} H ${r(exitX)} V ${r(bump)} H ${r(entryX)} V ${ty} H ${tx}`
  }

  // Right → left (FS): classic finish-to-start.
  if (fromSide === 'right' && toSide === 'left') {
    // Enough room: stub right, drop/rise, enter from left.
    if (tx >= sx + STUB * 2) {
      const midX = r(sx + STUB)
      return `M ${sx} ${sy} H ${midX} V ${ty} H ${tx}`
    }
    // Tight / overlapping / reverse: wrap via mid-Y corridor.
    const midY = r((sy + ty) / 2)
    return `M ${sx} ${sy} H ${r(exitX)} V ${midY} H ${r(entryX)} V ${ty} H ${tx}`
  }

  // Left → left (SS): leave and enter on start edges.
  if (fromSide === 'left' && toSide === 'left') {
    const rail = r(Math.min(sx, tx) - STUB)
    return `M ${sx} ${sy} H ${rail} V ${ty} H ${tx}`
  }

  // Right → right (FF): leave and enter on finish edges.
  if (fromSide === 'right' && toSide === 'right') {
    const rail = r(Math.max(sx, tx) + STUB)
    return `M ${sx} ${sy} H ${rail} V ${ty} H ${tx}`
  }

  // Left → right (SF).
  if (tx <= sx - STUB * 2) {
    const midX = r(sx - STUB)
    return `M ${sx} ${sy} H ${midX} V ${ty} H ${tx}`
  }
  const midY = r((sy + ty) / 2)
  return `M ${sx} ${sy} H ${r(exitX)} V ${midY} H ${r(entryX)} V ${ty} H ${tx}`
}

/**
 * Build SVG path data for task dependencies visible in the current row list.
 * Supports FS / SS / FF / SF (and short aliases).
 */
export function buildTimelineDependencyPaths(
  dependencies: GanttDependency[],
  rows: TimelineFlatRow[],
  columns: TimelineColumn[],
  colWidth: number
): TimelineDependencyPath[] {
  if (!dependencies.length || !columns.length || colWidth <= 0) return []

  const centers = rowCenters(rows)
  const barByTask = new Map<string, { left: number; right: number }>()
  for (const row of rows) {
    if (row.kind !== 'task' || !row.sourceEntityId || !row.startDate || !row.endDate) continue
    const range = computeBarPixelRange(row.startDate, row.endDate, columns, colWidth)
    if (range) barByTask.set(row.sourceEntityId, range)
  }

  const out: TimelineDependencyPath[] = []
  for (const dep of dependencies) {
    const pred = barByTask.get(dep.predecessorTaskId)
    const succ = barByTask.get(dep.successorTaskId)
    const y1 = centers.get(dep.predecessorTaskId)
    const y2 = centers.get(dep.successorTaskId)
    if (!pred || !succ || y1 == null || y2 == null) continue

    const type = (dep.dependencyType || 'FS').toUpperCase()
    let x1 = pred.right
    let x2 = succ.left
    let fromSide: AnchorSide = 'right'
    let toSide: AnchorSide = 'left'
    if (type === 'SS' || type === 'START_TO_START') {
      x1 = pred.left
      x2 = succ.left
      fromSide = 'left'
      toSide = 'left'
    } else if (type === 'FF' || type === 'FINISH_TO_FINISH') {
      x1 = pred.right
      x2 = succ.right
      fromSide = 'right'
      toSide = 'right'
    } else if (type === 'SF' || type === 'START_TO_FINISH') {
      x1 = pred.left
      x2 = succ.right
      fromSide = 'left'
      toSide = 'right'
    }

    out.push({
      id: dep.id,
      dependencyType: type,
      d: elbowPath(x1, y1, x2, y2, fromSide, toSide),
    })
  }
  return out
}
