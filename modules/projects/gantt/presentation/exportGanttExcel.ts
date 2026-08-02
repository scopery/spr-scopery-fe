import ExcelJS from 'exceljs'
import {
  durationDays,
  formatGanttDate,
  ganttItemTypeLabel,
  toDateOnly,
} from '../domain/rules/gantt.rules'
import {
  buildGanttExcelChartColumns,
  flattenGanttItemsForExport,
  ganttExcelBarFillHex,
  itemOverlapsChartColumn,
} from '../domain/rules/gantt-excel-chart.rules'
import type { GanttItem } from '../domain/model/gantt'

function triggerBrowserDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function safeFileStem(opts?: { projectName?: string | null; fileName?: string }) {
  return (
    (opts?.fileName || opts?.projectName || 'gantt-timeline')
      .replace(/[/\\?*[\]:]/g, '-')
      .slice(0, 80) || 'gantt-timeline'
  )
}

function addListSheet(
  wb: ExcelJS.Workbook,
  rows: ReturnType<typeof flattenGanttItemsForExport>
) {
  const sheet = wb.addWorksheet('Timeline', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
  })

  sheet.columns = [
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Schedule status', key: 'status', width: 16 },
    { header: 'Start date', key: 'start', width: 14 },
    { header: 'Finish date', key: 'finish', width: 14 },
    { header: 'Duration (days)', key: 'duration', width: 14 },
    { header: 'Phase ID', key: 'phaseId', width: 36 },
    { header: 'Planning element ID', key: 'wbsNodeId', width: 36 },
    { header: 'Assignee user ID', key: 'assignee', width: 36 },
  ]

  for (const { item, depth } of rows) {
    const indent = '  '.repeat(Math.max(0, depth))
    sheet.addRow({
      type: ganttItemTypeLabel(item.itemType),
      title: `${indent}${item.title}`,
      status: item.scheduleStatus,
      start: item.startDate ? toDateOnly(item.startDate) : '',
      finish: item.endDate ? toDateOnly(item.endDate) : '',
      duration: durationDays(item.startDate, item.endDate) ?? '',
      phaseId: item.phaseId ?? '',
      wbsNodeId: item.wbsNodeId ?? '',
      assignee: item.assigneeUserId ?? '',
    })
  }

  sheet.getRow(1).font = { bold: true }
}

function addGanttChartSheet(
  wb: ExcelJS.Workbook,
  rows: ReturnType<typeof flattenGanttItemsForExport>
) {
  const { scale, columns } = buildGanttExcelChartColumns(rows)
  const sheet = wb.addWorksheet('Gantt', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
  })

  // Header: Type | Title | day/week columns
  const header = sheet.getRow(1)
  header.getCell(1).value = 'Type'
  header.getCell(2).value = 'Title'
  header.font = { bold: true }

  columns.forEach((col, index) => {
    const cell = header.getCell(index + 3)
    cell.value = col.label
    cell.alignment = { horizontal: 'center', wrapText: true }
    sheet.getColumn(index + 3).width = scale === 'day' ? 4 : 6
  })

  sheet.getColumn(1).width = 10
  sheet.getColumn(2).width = 36

  if (columns.length === 0) {
    sheet.getCell(2, 1).value = 'No scheduled dates to plot'
    return
  }

  const scaleNote = sheet.getCell(1, columns.length + 3)
  scaleNote.value = scale === 'day' ? 'Scale: day' : 'Scale: week'
  scaleNote.font = { italic: true, color: { argb: 'FF71717A' } }

  rows.forEach(({ item, depth }, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 2)
    const indent = '  '.repeat(Math.max(0, depth))
    excelRow.getCell(1).value = ganttItemTypeLabel(item.itemType)
    excelRow.getCell(2).value = `${indent}${item.title}`

    const fillHex = ganttExcelBarFillHex(item)
    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(colIndex + 3)
      if (!itemOverlapsChartColumn(item, col)) return
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${fillHex}` },
      }
      // Milestone / zero-width: show a diamond mark so it is visible in a single cell
      if (
        item.itemType.toUpperCase() === 'MILESTONE' ||
        item.zeroDuration ||
        (!item.endDate && item.startDate)
      ) {
        cell.value = '◆'
        cell.alignment = { horizontal: 'center' }
        cell.font = { color: { argb: 'FFFFFFFF' }, size: 8 }
      }
    })
  })
}

function addSummarySheet(
  wb: ExcelJS.Workbook,
  rows: ReturnType<typeof flattenGanttItemsForExport>,
  projectName?: string | null
) {
  const flat = rows.map((r) => r.item)
  const scheduled = flat.filter(
    (i) => i.itemType === 'TASK' && i.startDate && i.scheduleStatus !== 'UNSCHEDULED'
  )
  const unscheduled = flat.filter(
    (i) => i.itemType === 'TASK' && (!i.startDate || i.scheduleStatus === 'UNSCHEDULED')
  )

  const sheet = wb.addWorksheet('Summary')
  sheet.addRow(['Project', projectName ?? ''])
  sheet.addRow(['Exported at', formatGanttDate(new Date().toISOString())])
  sheet.addRow(['Total rows', flat.length])
  sheet.addRow(['Scheduled tasks', scheduled.length])
  sheet.addRow(['Unscheduled tasks', unscheduled.length])
  sheet.addRow([])
  sheet.addRow(['Legend (Gantt sheet)'])
  sheet.addRow(['Project', '#E4EA94'])
  sheet.addRow(['Phase', '#AEE2DD'])
  sheet.addRow(['Planning Element', '#EDCFEA'])
  sheet.addRow(['Task bar', '#A8B8FC'])
  sheet.addRow(['Milestone', 'Violet ◆'])
  sheet.addRow(['At risk / Delayed', 'Amber'])
  sheet.getColumn(1).width = 24
  sheet.getColumn(2).width = 28
}

/**
 * Build an Excel workbook with:
 * - Timeline: tabular task list
 * - Gantt: day/week columns with colored bars
 * - Summary: counts + legend
 */
export async function downloadGanttExcel(
  items: GanttItem[],
  opts?: { projectName?: string | null; fileName?: string }
): Promise<void> {
  const rows = flattenGanttItemsForExport(items)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scopery'
  wb.created = new Date()

  addListSheet(wb, rows)
  addGanttChartSheet(wb, rows)
  addSummarySheet(wb, rows, opts?.projectName)

  const buffer = await wb.xlsx.writeBuffer()
  const bytes =
    buffer instanceof ArrayBuffer
      ? buffer
      : Uint8Array.from(buffer as ArrayLike<number>).buffer

  triggerBrowserDownload(bytes, `${safeFileStem(opts)}.xlsx`)
}
