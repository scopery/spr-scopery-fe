import type { CSSProperties } from 'react'

/**
 * Shared split-board layout for Project Timeline + Team Schedule.
 *
 * Contract:
 * - Left list: vertical scroll only; canvas rows sync via scrollTop.
 * - Right canvas: wheel / alt-drag / middle-drag pans horizontally (dates).
 * - Right pane uses width:0 + flex-basis 0 so Day canvasWidth cannot expand
 *   the flex column (that would kill scrollWidth > clientWidth).
 */
export const TIMELINE_BOARD_LAYOUT = {
  board: 'flex min-h-0 min-w-0 flex-1 overflow-hidden border border-neutral-200 bg-white',
  leftPane: 'flex shrink-0 flex-col border-r border-neutral-200',
  leftBody:
    'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain',
  rightPane: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  header:
    'min-w-0 shrink-0 overflow-x-hidden overflow-y-hidden border-b border-neutral-200 bg-neutral-50',
  canvas:
    'min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain',
  canvasTitle:
    'Scroll wheel pans dates · scroll the left list for rows · Alt+drag or middle-click to pan',
} as const

export const timelineBoardRightPaneStyle: CSSProperties = {
  minWidth: 0,
  width: 0,
  flex: '1 1 0%',
}

export const timelineBoardCanvasStyle: CSSProperties = {
  minWidth: 0,
}

export function timelineBoardContentStyle(canvasWidth: number): CSSProperties {
  const w = Math.max(canvasWidth, 1)
  return { width: w, minWidth: w }
}

export function timelineBoardLeftPaneStyle(leftWidth: number): CSSProperties {
  return { width: leftWidth, maxWidth: leftWidth }
}
