/**
 * Shared Excel look-and-feel for timeline / schedule reports.
 * Corporate, flat, no icons — hierarchy via layout; status via text color only.
 * Change once → Project Timeline + Team Schedule exports pick it up.
 */

export const EXCEL_CREATOR = 'Scopery'
export const EXCEL_FONT_NAME = 'Century Gothic'

export const EXCEL_FONT = {
  name: EXCEL_FONT_NAME,
  size: 11,
} as const

export const EXCEL_HEADER_FONT = {
  name: EXCEL_FONT_NAME,
  size: 11,
  bold: true,
  color: { argb: 'FF334155' },
} as const

export const EXCEL_TITLE_FONT = {
  name: EXCEL_FONT_NAME,
  size: 16,
  bold: true,
  color: { argb: 'FF0F172A' },
} as const

export const EXCEL_KPI_VALUE_FONT = {
  name: EXCEL_FONT_NAME,
  size: 18,
  bold: true,
  color: { argb: 'FF0F172A' },
} as const

export const EXCEL_MUTED_FONT = {
  name: EXCEL_FONT_NAME,
  size: 10,
  italic: true,
  color: { argb: 'FF64748B' },
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

export function excelFontColor(hexRRGGBB: string): { argb: string } {
  return { argb: `FF${hexRRGGBB.replace(/^#/, '').toUpperCase()}` }
}

export type ScheduleExcelLevel = 'project' | 'phase' | 'plan' | 'task'

/**
 * Hierarchy palette — used for row backgrounds and Gantt bars.
 * Status colors are separate (text only).
 */
export const TIMELINE_EXCEL_LEVEL = {
  project: {
    rowBg: '1E3A5F',
    text: 'FFFFFF',
    bar: '1E3A5F',
    barProgress: '0F2744',
    fontSize: 12,
    bold: true,
    indent: 0,
    rowHeight: 26,
  },
  phase: {
    rowBg: 'EEF2F6',
    text: '0F172A',
    bar: '3B6EA5',
    barProgress: '1E4A7A',
    fontSize: 11,
    bold: true,
    indent: 1,
    rowHeight: 22,
  },
  plan: {
    rowBg: 'FFFFFF',
    text: '1E293B',
    bar: '7BA3C9',
    barProgress: '4A7AAA',
    fontSize: 11,
    bold: false,
    indent: 2,
    rowHeight: 20,
  },
  task: {
    rowBg: 'FFFFFF',
    text: '334155',
    bar: '94A3B8',
    barProgress: '64748B',
    /** Remaining / not-yet-progressed portion of the bar */
    barRemain: 'E2E8F0',
    fontSize: 10,
    bold: false,
    indent: 3,
    rowHeight: 18,
  },
} as const

/** Status — text / light cell tint only (never paint whole Gantt by status). */
export const TIMELINE_EXCEL_STATUS_TEXT = {
  on_track: { text: '166534', bg: 'F0FDF4' },
  in_progress: { text: '1D4ED8', bg: 'EFF6FF' },
  at_risk: { text: 'C2410C', bg: 'FFF7ED' },
  delayed: { text: 'B91C1C', bg: 'FEF2F2' },
  overdue: { text: 'B91C1C', bg: 'FEF2F2' },
  completed: { text: '166534', bg: 'F8FAFC' },
  not_started: { text: '64748B', bg: 'FFFFFF' },
  not_started_late: { text: 'C2410C', bg: 'FFF7ED' },
  unscheduled: { text: '94A3B8', bg: 'FFFFFF' },
  structure: { text: '64748B', bg: 'FFFFFF' },
} as const

export const TIMELINE_EXCEL_UI = {
  todayColumn: 'F1F5F9',
  overdueTail: 'FECACA',
  headerBg: 'F8FAFC',
  gridLine: 'E2E8F0',
  phaseBorder: 'CBD5E1',
  projectBorder: '0F172A',
  milestoneMark: '1E3A5F',
} as const

/** @deprecated Prefer TIMELINE_EXCEL_LEVEL / TIMELINE_EXCEL_STATUS_TEXT. */
export const TIMELINE_EXCEL_STATUS_COLORS = {
  notStarted: TIMELINE_EXCEL_LEVEL.task.barRemain,
  inProgress: TIMELINE_EXCEL_LEVEL.task.barProgress,
  completed: TIMELINE_EXCEL_STATUS_TEXT.completed.text,
  atRisk: TIMELINE_EXCEL_STATUS_TEXT.at_risk.text,
  delayed: TIMELINE_EXCEL_STATUS_TEXT.delayed.text,
  overdue: TIMELINE_EXCEL_STATUS_TEXT.overdue.text,
  unscheduled: TIMELINE_EXCEL_LEVEL.task.barRemain,
  planBaseline: TIMELINE_EXCEL_LEVEL.task.barRemain,
  structure: TIMELINE_EXCEL_LEVEL.phase.bar,
  project: TIMELINE_EXCEL_LEVEL.project.bar,
  phase: TIMELINE_EXCEL_LEVEL.phase.bar,
  wbs: TIMELINE_EXCEL_LEVEL.plan.bar,
  milestone: TIMELINE_EXCEL_UI.milestoneMark,
  todayColumn: TIMELINE_EXCEL_UI.todayColumn,
  overdueTail: TIMELINE_EXCEL_UI.overdueTail,
} as const

/** @deprecated Prefer TIMELINE_EXCEL_LEVEL. */
export const TIMELINE_EXCEL_BAR_COLORS = {
  project: TIMELINE_EXCEL_LEVEL.project.bar,
  phase: TIMELINE_EXCEL_LEVEL.phase.bar,
  wbs: TIMELINE_EXCEL_LEVEL.plan.bar,
  task: TIMELINE_EXCEL_LEVEL.task.bar,
  milestone: TIMELINE_EXCEL_UI.milestoneMark,
  atRisk: TIMELINE_EXCEL_STATUS_TEXT.at_risk.text,
  unscheduled: TIMELINE_EXCEL_LEVEL.task.barRemain,
  unassigned: 'A1A1AA',
} as const

export type TimelineExcelLegendEntry = {
  label: string
  colorHex: string
  note?: string
}

/** Level legend (Gantt bar hierarchy) + status text legend — no icons. */
export const TIMELINE_EXCEL_LEVEL_LEGEND: TimelineExcelLegendEntry[] = [
  { label: 'Project bar', colorHex: TIMELINE_EXCEL_LEVEL.project.bar },
  { label: 'Phase bar', colorHex: TIMELINE_EXCEL_LEVEL.phase.bar },
  { label: 'Plan item bar', colorHex: TIMELINE_EXCEL_LEVEL.plan.bar },
  { label: 'Task bar / progress', colorHex: TIMELINE_EXCEL_LEVEL.task.barProgress },
  { label: 'Remaining plan', colorHex: TIMELINE_EXCEL_LEVEL.task.barRemain },
  { label: 'Late (past Plan End)', colorHex: TIMELINE_EXCEL_UI.overdueTail },
  { label: 'Today column', colorHex: TIMELINE_EXCEL_UI.todayColumn },
]

export const TIMELINE_EXCEL_STATUS_LEGEND: TimelineExcelLegendEntry[] = [
  { label: 'On track / Completed', colorHex: TIMELINE_EXCEL_STATUS_TEXT.completed.text },
  { label: 'In progress', colorHex: TIMELINE_EXCEL_STATUS_TEXT.in_progress.text },
  { label: 'At risk', colorHex: TIMELINE_EXCEL_STATUS_TEXT.at_risk.text },
  { label: 'Delayed / Overdue', colorHex: TIMELINE_EXCEL_STATUS_TEXT.delayed.text },
  { label: 'Not started', colorHex: TIMELINE_EXCEL_STATUS_TEXT.not_started.text },
]

/** Legacy — prefer TIMELINE_EXCEL_LEVEL_LEGEND + TIMELINE_EXCEL_STATUS_LEGEND. */
export const TIMELINE_EXCEL_LEGEND: Array<{ label: string; swatch: string }> =
  TIMELINE_EXCEL_LEVEL_LEGEND.map((e) => ({ label: e.label, swatch: '' }))

/** Resolve hierarchy level from gantt item type. */
export function scheduleExcelLevelFromItemType(
  itemType: string | null | undefined
): ScheduleExcelLevel {
  switch ((itemType ?? '').toUpperCase()) {
    case 'PROJECT':
      return 'project'
    case 'PHASE':
      return 'phase'
    case 'WBS_NODE':
      return 'plan'
    default:
      return 'task'
  }
}
