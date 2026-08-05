/**
 * Shared Excel look-and-feel. Change once → all timeline (and similar) exports pick it up.
 */

export const EXCEL_CREATOR = 'Scopery'

/** Default body font for workbook cells. */
export const EXCEL_FONT = {
  name: 'Calibri',
  size: 11,
} as const

/** Header row font (list / chart sheets). */
export const EXCEL_HEADER_FONT = {
  name: 'Calibri',
  size: 11,
  bold: true,
} as const

export const EXCEL_MUTED_FONT = {
  name: 'Calibri',
  size: 10,
  italic: true,
  color: { argb: 'FF71717A' },
} as const

/** Milestone diamond mark on chart cells. */
export const EXCEL_MILESTONE_MARK = '◆'

export const EXCEL_MILESTONE_FONT = {
  name: 'Calibri',
  size: 8,
  color: { argb: 'FFFFFFFF' },
} as const

/** Solid cell fill from RRGGBB (no alpha). */
export function excelSolidFill(hexRRGGBB: string): {
  type: 'pattern'
  pattern: 'solid'
  fgColor: { argb: string }
} {
  const hex = hexRRGGBB.replace(/^#/, '').toUpperCase()
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${hex}` },
  }
}

/** Canonical bar colors for schedule charts (RRGGBB). */
export const TIMELINE_EXCEL_BAR_COLORS = {
  project: 'E4EA94',
  phase: 'AEE2DD',
  wbs: 'EDCFEA',
  task: 'A8B8FC',
  milestone: '8B5CF6',
  atRisk: 'F59E0B',
  unscheduled: 'D4D4D8',
  unassigned: 'A1A1AA',
} as const

export const TIMELINE_EXCEL_LEGEND: Array<{ label: string; swatch: string }> = [
  { label: 'Project', swatch: `#${TIMELINE_EXCEL_BAR_COLORS.project}` },
  { label: 'Phase', swatch: `#${TIMELINE_EXCEL_BAR_COLORS.phase}` },
  { label: 'Planning Element', swatch: `#${TIMELINE_EXCEL_BAR_COLORS.wbs}` },
  { label: 'Task bar', swatch: `#${TIMELINE_EXCEL_BAR_COLORS.task}` },
  { label: 'Milestone', swatch: 'Violet ◆' },
  { label: 'At risk / Delayed', swatch: 'Amber' },
  { label: 'Unassigned', swatch: `#${TIMELINE_EXCEL_BAR_COLORS.unassigned}` },
]
