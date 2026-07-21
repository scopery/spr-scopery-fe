import * as XLSX from 'xlsx'
import {
  durationDays,
  formatGanttDate,
  ganttItemTypeLabel,
  toDateOnly,
} from '../domain/rules/gantt.rules'
import type { GanttItem } from '../domain/model/gantt'

function flattenItems(items: GanttItem[]): GanttItem[] {
  const out: GanttItem[] = []
  const walk = (list: GanttItem[], depth: number) => {
    for (const item of list) {
      out.push({ ...item, metadata: { ...item.metadata, __depth: depth } })
      if (item.children?.length) walk(item.children, depth + 1)
    }
  }
  walk(items, 0)
  return out
}

/** Build an Excel workbook from current Gantt items and trigger download. */
export function downloadGanttExcel(
  items: GanttItem[],
  opts?: { projectName?: string | null; fileName?: string }
): void {
  const flat = flattenItems(items)
  const headers = [
    'Type',
    'Title',
    'Schedule status',
    'Start date',
    'Finish date',
    'Duration (days)',
    'Phase ID',
    'WBS node ID',
    'Assignee user ID',
  ]
  const rows = flat.map((item) => {
    const depth =
      typeof item.metadata?.__depth === 'number' ? (item.metadata.__depth as number) : 0
    const indent = '  '.repeat(Math.max(0, depth))
    return [
      ganttItemTypeLabel(item.itemType),
      `${indent}${item.title}`,
      item.scheduleStatus,
      item.startDate ? toDateOnly(item.startDate) : '',
      item.endDate ? toDateOnly(item.endDate) : '',
      durationDays(item.startDate, item.endDate) ?? '',
      item.phaseId ?? '',
      item.wbsNodeId ?? '',
      item.assigneeUserId ?? '',
    ]
  })

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  sheet['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 36 },
    { wch: 36 },
    { wch: 36 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Timeline')

  const scheduled = flat.filter(
    (i) => i.itemType === 'TASK' && i.startDate && i.scheduleStatus !== 'UNSCHEDULED'
  )
  const unscheduled = flat.filter(
    (i) => i.itemType === 'TASK' && (!i.startDate || i.scheduleStatus === 'UNSCHEDULED')
  )
  const summary = XLSX.utils.aoa_to_sheet([
    ['Project', opts?.projectName ?? ''],
    ['Exported at', formatGanttDate(new Date().toISOString())],
    ['Total rows', flat.length],
    ['Scheduled tasks', scheduled.length],
    ['Unscheduled tasks', unscheduled.length],
  ])
  XLSX.utils.book_append_sheet(wb, summary, 'Summary')

  const safe =
    (opts?.fileName || opts?.projectName || 'gantt-timeline')
      .replace(/[/\\?*[\]:]/g, '-')
      .slice(0, 80) || 'gantt-timeline'
  XLSX.writeFile(wb, `${safe}.xlsx`)
}
