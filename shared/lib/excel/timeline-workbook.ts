import ExcelJS from 'exceljs'
import {
  excelWriteBufferToArrayBuffer,
  safeExcelFileStem,
  triggerBrowserDownload,
} from './download'
import {
  buildTimelineExcelChartColumns,
  excelDurationDays,
  formatExcelExportTimestamp,
  spanOverlapsChartColumn,
  toExcelDateOnly,
} from './timeline-chart'
import {
  EXCEL_CREATOR,
  EXCEL_FONT,
  EXCEL_HEADER_FONT,
  EXCEL_MILESTONE_FONT,
  EXCEL_MILESTONE_MARK,
  EXCEL_MUTED_FONT,
  TIMELINE_EXCEL_LEGEND,
  excelSolidFill,
} from './style'

export interface TimelineExcelListColumn {
  key: string
  header: string
  width?: number
}

/**
 * One row for shared timeline Excel (list + gantt chart).
 * Domain modules map their models → this shape; styling lives in `style.ts`.
 */
export interface TimelineExcelRow {
  typeLabel: string
  title: string
  depth?: number
  scheduleStatus?: string
  startDate: string | null
  endDate: string | null
  /** RRGGBB bar fill */
  fillHex: string
  isMilestone?: boolean
  /** Extra list-sheet values keyed by column `key` */
  cells?: Record<string, string | number | null | undefined>
}

export interface TimelineExcelWorkbookOptions {
  /** Shown on Summary sheet */
  title?: string | null
  /** File stem without .xlsx */
  fileName?: string
  fileNameFallback?: string
  listSheetName?: string
  chartSheetName?: string
  listColumns?: TimelineExcelListColumn[]
  legend?: Array<{ label: string; swatch: string }>
  summaryLines?: Array<[string, string | number]>
}

const DEFAULT_LIST_COLUMNS: TimelineExcelListColumn[] = [
  { key: 'type', header: 'Type', width: 12 },
  { key: 'title', header: 'Title', width: 40 },
  { key: 'status', header: 'Schedule status', width: 16 },
  { key: 'start', header: 'Start date', width: 14 },
  { key: 'finish', header: 'Finish date', width: 14 },
  { key: 'duration', header: 'Duration (days)', width: 14 },
]

function applyHeaderRow(row: ExcelJS.Row) {
  row.font = { ...EXCEL_HEADER_FONT }
}

function addListSheet(
  wb: ExcelJS.Workbook,
  rows: TimelineExcelRow[],
  columns: TimelineExcelListColumn[],
  sheetName: string
) {
  const sheet = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
  })

  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 16,
  }))
  applyHeaderRow(sheet.getRow(1))

  for (const row of rows) {
    const indent = '  '.repeat(Math.max(0, row.depth ?? 0))
    const record: Record<string, string | number> = {}
    for (const col of columns) {
      switch (col.key) {
        case 'type':
          record.type = row.typeLabel
          break
        case 'title':
          record.title = `${indent}${row.title}`
          break
        case 'status':
          record.status = row.scheduleStatus ?? ''
          break
        case 'start':
          record.start = toExcelDateOnly(row.startDate) ?? ''
          break
        case 'finish':
          record.finish = toExcelDateOnly(row.endDate) ?? ''
          break
        case 'duration': {
          const days = excelDurationDays(row.startDate, row.endDate)
          record.duration = days ?? ''
          break
        }
        default: {
          const v = row.cells?.[col.key]
          record[col.key] = v == null ? '' : v
          break
        }
      }
    }
    sheet.addRow(record)
  }

  sheet.eachRow((r) => {
    r.font = { ...EXCEL_FONT, ...(r.number === 1 ? EXCEL_HEADER_FONT : {}) }
  })
  applyHeaderRow(sheet.getRow(1))
}

function addChartSheet(
  wb: ExcelJS.Workbook,
  rows: TimelineExcelRow[],
  sheetName: string
) {
  const { scale, columns } = buildTimelineExcelChartColumns(rows)
  const sheet = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
  })

  const header = sheet.getRow(1)
  header.getCell(1).value = 'Type'
  header.getCell(2).value = 'Title'
  applyHeaderRow(header)

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
    sheet.getCell(2, 1).font = { ...EXCEL_FONT }
    return
  }

  const scaleNote = sheet.getCell(1, columns.length + 3)
  scaleNote.value = scale === 'day' ? 'Scale: day' : 'Scale: week'
  scaleNote.font = { ...EXCEL_MUTED_FONT }

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 2)
    const indent = '  '.repeat(Math.max(0, row.depth ?? 0))
    excelRow.getCell(1).value = row.typeLabel
    excelRow.getCell(2).value = `${indent}${row.title}`
    excelRow.getCell(1).font = { ...EXCEL_FONT }
    excelRow.getCell(2).font = { ...EXCEL_FONT }

    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(colIndex + 3)
      if (!spanOverlapsChartColumn(row, col)) return
      cell.fill = excelSolidFill(row.fillHex)
      if (row.isMilestone) {
        cell.value = EXCEL_MILESTONE_MARK
        cell.alignment = { horizontal: 'center' }
        cell.font = { ...EXCEL_MILESTONE_FONT }
      }
    })
  })
}

function addSummarySheet(
  wb: ExcelJS.Workbook,
  rows: TimelineExcelRow[],
  opts: TimelineExcelWorkbookOptions
) {
  const sheet = wb.addWorksheet('Summary')
  sheet.addRow(['Title', opts.title ?? ''])
  sheet.addRow(['Exported at', formatExcelExportTimestamp()])
  sheet.addRow(['Total rows', rows.length])

  for (const line of opts.summaryLines ?? []) {
    sheet.addRow(line)
  }

  sheet.addRow([])
  sheet.addRow(['Legend (Gantt sheet)'])
  for (const entry of opts.legend ?? TIMELINE_EXCEL_LEGEND) {
    sheet.addRow([entry.label, entry.swatch])
  }

  sheet.getColumn(1).width = 24
  sheet.getColumn(2).width = 28
  sheet.eachRow((r) => {
    r.font = { ...EXCEL_FONT }
  })
}

/**
 * Build Timeline + Gantt + Summary workbook and download it.
 * Style changes: edit `shared/lib/excel/style.ts`.
 */
export async function downloadTimelineExcelWorkbook(
  rows: TimelineExcelRow[],
  opts: TimelineExcelWorkbookOptions = {}
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = EXCEL_CREATOR
  wb.created = new Date()

  addListSheet(
    wb,
    rows,
    opts.listColumns ?? DEFAULT_LIST_COLUMNS,
    opts.listSheetName ?? 'Timeline'
  )
  addChartSheet(wb, rows, opts.chartSheetName ?? 'Gantt')
  addSummarySheet(wb, rows, opts)

  const buffer = await wb.xlsx.writeBuffer()
  const bytes = excelWriteBufferToArrayBuffer(buffer)
  const stem = safeExcelFileStem(
    opts.fileName ?? opts.title,
    opts.fileNameFallback ?? 'timeline'
  )
  triggerBrowserDownload(bytes, `${stem}.xlsx`)
}
