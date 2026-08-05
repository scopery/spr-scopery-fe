/**
 * Shared Excel look-and-feel for timeline / schedule reports.
 * Change once → Project Timeline + Team Schedule exports pick it up.
 */

export const EXCEL_CREATOR = 'Scopery'

export const EXCEL_FONT = {
  name: 'Century Gothic',
  size: 11,
} as const

export const EXCEL_HEADER_FONT = {
  name: 'Century Gothic',
  size: 11,
  bold: true,
} as const

export const EXCEL_TITLE_FONT = {
  name: 'Century Gothic',
  size: 16,
  bold: true,
} as const

export const EXCEL_KPI_VALUE_FONT = {
  name: 'Century Gothic',
  size: 18,
  bold: true,
} as const

export const EXCEL_MUTED_FONT = {
  name: 'Century Gothic',
  size: 10,
  italic: true,
  color: { argb: 'FF71717A' },
} as const

export const EXCEL_MILESTONE_MARK = '◆'
export const EXCEL_COMPLETED_MARK = '✓'

export const EXCEL_MILESTONE_FONT = {
  name: 'Century Gothic',
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

/**
 * Report status palette (user-facing Gantt bars).
 * Prefer these over type colors for tasks/milestones.
 */
export const TIMELINE_EXCEL_STATUS_COLORS = {
  notStarted: 'D4D4D8',
  inProgress: '60A5FA',
  completed: '22C55E',
  atRisk: 'F59E0B',
  delayed: 'EF4444',
  overdue: 'DC2626',
  unscheduled: 'E4E4E7',
  /** Light plan baseline under actual progress */
  planBaseline: 'E0E7FF',
  /** Structure rows (project / phase / WBS) */
  structure: 'AEE2DD',
  project: 'E4EA94',
  phase: 'AEE2DD',
  wbs: 'EDCFEA',
  milestone: '8B5CF6',
  todayColumn: 'FEF08A',
  overdueTail: 'FECACA',
} as const

/** @deprecated Prefer TIMELINE_EXCEL_STATUS_COLORS — kept for older call sites. */
export const TIMELINE_EXCEL_BAR_COLORS = {
  project: TIMELINE_EXCEL_STATUS_COLORS.project,
  phase: TIMELINE_EXCEL_STATUS_COLORS.phase,
  wbs: TIMELINE_EXCEL_STATUS_COLORS.wbs,
  task: TIMELINE_EXCEL_STATUS_COLORS.inProgress,
  milestone: TIMELINE_EXCEL_STATUS_COLORS.milestone,
  atRisk: TIMELINE_EXCEL_STATUS_COLORS.atRisk,
  unscheduled: TIMELINE_EXCEL_STATUS_COLORS.unscheduled,
  unassigned: 'A1A1AA',
} as const

export type TimelineExcelLegendEntry = {
  label: string
  /** RRGGBB for a real color swatch cell */
  colorHex: string
  note?: string
}

export const TIMELINE_EXCEL_STATUS_LEGEND: TimelineExcelLegendEntry[] = [
  { label: 'Not started', colorHex: TIMELINE_EXCEL_STATUS_COLORS.notStarted },
  { label: 'In progress', colorHex: TIMELINE_EXCEL_STATUS_COLORS.inProgress },
  { label: 'Completed', colorHex: TIMELINE_EXCEL_STATUS_COLORS.completed, note: '✓' },
  { label: 'At risk', colorHex: TIMELINE_EXCEL_STATUS_COLORS.atRisk },
  { label: 'Delayed / Overdue', colorHex: TIMELINE_EXCEL_STATUS_COLORS.delayed },
  { label: 'Plan baseline', colorHex: TIMELINE_EXCEL_STATUS_COLORS.planBaseline },
  { label: 'Today column', colorHex: TIMELINE_EXCEL_STATUS_COLORS.todayColumn },
  { label: 'Milestone', colorHex: TIMELINE_EXCEL_STATUS_COLORS.milestone, note: '◆' },
]

/** Legacy hex-string legend — prefer TIMELINE_EXCEL_STATUS_LEGEND. */
export const TIMELINE_EXCEL_LEGEND: Array<{ label: string; swatch: string }> =
  TIMELINE_EXCEL_STATUS_LEGEND.map((e) => ({
    label: e.label,
    swatch: e.note ? `${e.note}` : '',
  }))
