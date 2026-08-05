import {
  TIMELINE_EXCEL_STATUS_COLORS,
  TIMELINE_EXCEL_MAX_DAY_COLUMNS,
  buildTimelineExcelChartColumns,
  spanOverlapsChartColumn,
  toExcelDateOnly,
  type TimelineExcelChartColumn,
  type TimelineExcelChartScale,
} from '@/shared/lib/excel'
import { toDateOnly } from './gantt.rules'
import type { GanttItem } from '../model/gantt'

export const GANTT_EXCEL_MAX_DAY_COLUMNS = TIMELINE_EXCEL_MAX_DAY_COLUMNS

export type GanttExcelChartScale = TimelineExcelChartScale
export type GanttExcelChartColumn = TimelineExcelChartColumn

export interface FlattenedGanttExcelRow {
  item: GanttItem
  depth: number
}

export function flattenGanttItemsForExport(items: GanttItem[]): FlattenedGanttExcelRow[] {
  const out: FlattenedGanttExcelRow[] = []
  const walk = (list: GanttItem[], depth: number) => {
    for (const item of list) {
      out.push({ item, depth })
      if (item.children?.length) walk(item.children, depth + 1)
    }
  }
  walk(items, 0)
  return out
}

/**
 * Build a contiguous day or week axis covering scheduled items.
 * Delegates to shared timeline Excel chart helpers.
 */
export function buildGanttExcelChartColumns(
  items: FlattenedGanttExcelRow[],
  maxDayColumns: number = GANTT_EXCEL_MAX_DAY_COLUMNS
): { scale: GanttExcelChartScale; columns: GanttExcelChartColumn[] } {
  return buildTimelineExcelChartColumns(
    items.map(({ item }) => ({
      startDate: toDateOnly(item.startDate),
      endDate: toDateOnly(item.endDate ?? item.startDate),
    })),
    maxDayColumns
  )
}

export function itemOverlapsChartColumn(
  item: GanttItem,
  column: GanttExcelChartColumn
): boolean {
  return spanOverlapsChartColumn(
    {
      startDate: toDateOnly(item.startDate),
      endDate: toDateOnly(item.endDate ?? item.startDate),
    },
    column
  )
}

export function ganttExcelBarFillHex(item: GanttItem): string {
  const status = (item.scheduleStatus ?? '').toUpperCase()
  if (status === 'UNSCHEDULED') return TIMELINE_EXCEL_STATUS_COLORS.unscheduled
  if (status === 'AT_RISK') return TIMELINE_EXCEL_STATUS_COLORS.atRisk
  if (status === 'DELAYED') return TIMELINE_EXCEL_STATUS_COLORS.delayed
  switch ((item.itemType ?? '').toUpperCase()) {
    case 'PROJECT':
      return TIMELINE_EXCEL_STATUS_COLORS.project
    case 'PHASE':
      return TIMELINE_EXCEL_STATUS_COLORS.phase
    case 'WBS_NODE':
      return TIMELINE_EXCEL_STATUS_COLORS.wbs
    case 'MILESTONE':
      return TIMELINE_EXCEL_STATUS_COLORS.milestone
    case 'TASK':
    default:
      return TIMELINE_EXCEL_STATUS_COLORS.inProgress
  }
}

export { toExcelDateOnly }
