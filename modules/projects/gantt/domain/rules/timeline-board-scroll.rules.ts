/** Map trackpad/mouse wheel to a single horizontal pan delta. */
export function wheelDeltaToHorizontalPan(deltaX: number, deltaY: number): number {
  return Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
}

/** Clamp canvas scrollLeft after applying a horizontal pan delta. */
export function clampScrollLeft(
  scrollLeft: number,
  maxLeft: number,
  dx: number
): number {
  if (maxLeft <= 0) return scrollLeft
  return Math.max(0, Math.min(maxLeft, scrollLeft + dx))
}

/** Center a column in the visible canvas viewport. */
export function columnScrollLeft(
  columnIndex: number,
  colWidth: number,
  clientWidth: number
): number {
  if (columnIndex < 0) return 0
  return Math.max(0, columnIndex * colWidth - clientWidth / 2 + colWidth / 2)
}
