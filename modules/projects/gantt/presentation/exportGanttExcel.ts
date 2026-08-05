import {
  downloadTimelineExcelWorkbook,
  type TimelineExcelListColumn,
  type TimelineExcelRow,
} from '@/shared/lib/excel'
import { ganttItemTypeLabel, toDateOnly } from '../domain/rules/gantt.rules'
import {
  flattenGanttItemsForExport,
  ganttExcelBarFillHex,
} from '../domain/rules/gantt-excel-chart.rules'
import type { GanttItem } from '../domain/model/gantt'

const GANTT_LIST_COLUMNS: TimelineExcelListColumn[] = [
  { key: 'type', header: 'Type', width: 12 },
  { key: 'title', header: 'Title', width: 40 },
  { key: 'status', header: 'Schedule status', width: 16 },
  { key: 'start', header: 'Start date', width: 14 },
  { key: 'finish', header: 'Finish date', width: 14 },
  { key: 'duration', header: 'Duration (days)', width: 14 },
  { key: 'phaseId', header: 'Phase ID', width: 36 },
  { key: 'wbsNodeId', header: 'Planning element ID', width: 36 },
  { key: 'assignee', header: 'Assignee user ID', width: 36 },
]

function mapGanttToExcelRows(items: GanttItem[]): TimelineExcelRow[] {
  return flattenGanttItemsForExport(items).map(({ item, depth }) => {
    const itemType = (item.itemType ?? '').toUpperCase()
    const isMilestone =
      itemType === 'MILESTONE' ||
      Boolean(item.zeroDuration) ||
      Boolean(item.startDate && !item.endDate)

    return {
      typeLabel: ganttItemTypeLabel(item.itemType),
      title: item.title,
      depth,
      scheduleStatus: item.scheduleStatus,
      startDate: toDateOnly(item.startDate),
      endDate: toDateOnly(item.endDate),
      fillHex: ganttExcelBarFillHex(item),
      isMilestone,
      cells: {
        phaseId: item.phaseId ?? '',
        wbsNodeId: item.wbsNodeId ?? '',
        assignee: item.assigneeUserId ?? '',
      },
    }
  })
}

/**
 * Build an Excel workbook with Timeline + Gantt + Summary.
 * Visual style is shared via `@/shared/lib/excel` (change once for all timeline exports).
 */
export async function downloadGanttExcel(
  items: GanttItem[],
  opts?: { projectName?: string | null; fileName?: string }
): Promise<void> {
  const rows = mapGanttToExcelRows(items)
  const scheduled = items.flatMap(function collect(item: GanttItem): GanttItem[] {
    return [item, ...(item.children?.flatMap(collect) ?? [])]
  }).filter(
    (i) => i.itemType === 'TASK' && i.startDate && i.scheduleStatus !== 'UNSCHEDULED'
  )
  const unscheduled = items.flatMap(function collect(item: GanttItem): GanttItem[] {
    return [item, ...(item.children?.flatMap(collect) ?? [])]
  }).filter(
    (i) => i.itemType === 'TASK' && (!i.startDate || i.scheduleStatus === 'UNSCHEDULED')
  )

  await downloadTimelineExcelWorkbook(rows, {
    title: opts?.projectName,
    fileName: opts?.fileName ?? opts?.projectName ?? undefined,
    fileNameFallback: 'gantt-timeline',
    listColumns: GANTT_LIST_COLUMNS,
    summaryLines: [
      ['Scheduled tasks', scheduled.length],
      ['Unscheduled tasks', unscheduled.length],
    ],
  })
}
