/**
 * Hard layout tokens for Cell Timeline — do not invent random heights/widths in UI.
 */

export const TIMELINE_ROW_HEIGHT = {
  PROJECT: 56,
  PHASE: 56,
  TASK: 40,
  MILESTONE: 40,
  ADD_TASK: 36,
  /** +10px vs prior 44 — room for clearer month context in the date header. */
  HEADER: 54,
} as const

export const TIMELINE_LEFT_COLS = {
  CHECKBOX: 28,
  /** Slightly narrower so more of the date grid stays visible. */
  ITEM: 260,
  STATUS: 88,
  PROGRESS: 64,
  ESTIMATE: 64,
} as const

export const TIMELINE_LEFT_DEFAULT = 480
export const TIMELINE_LEFT_MIN = 400
export const TIMELINE_LEFT_MAX_RATIO = 0.6

export const TIMELINE_CONTROL_H = 36

export const TIMELINE_SEGMENT = {
  VERTICAL_INSET: 4,
  HORIZONTAL_INSET: 2,
  TASK_HEIGHT: 24,
  PHASE_HEIGHT: 30,
  MIN_WIDTH: 8,
} as const

export function timelineRowHeight(
  kind: 'phase' | 'task' | 'milestone' | 'add',
  itemType?: string
): number {
  if (kind === 'add') return TIMELINE_ROW_HEIGHT.ADD_TASK
  if (kind === 'milestone') return TIMELINE_ROW_HEIGHT.MILESTONE
  if (kind === 'task') return TIMELINE_ROW_HEIGHT.TASK
  if (itemType === 'PROJECT') return TIMELINE_ROW_HEIGHT.PROJECT
  return TIMELINE_ROW_HEIGHT.PHASE
}

export function timelineLeftPaneContentWidth(): number {
  return (
    TIMELINE_LEFT_COLS.CHECKBOX +
    TIMELINE_LEFT_COLS.ITEM +
    TIMELINE_LEFT_COLS.STATUS +
    TIMELINE_LEFT_COLS.PROGRESS +
    TIMELINE_LEFT_COLS.ESTIMATE
  )
}
