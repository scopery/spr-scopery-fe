import ExcelJS from 'exceljs'
import {
  excelWriteBufferToArrayBuffer,
  safeExcelFileStem,
  triggerBrowserDownload,
} from './download'
import {
  buildMonthGroups,
  buildTimelineExcelChartColumns,
  findTodayColumnIndex,
  formatExcelDisplayDate,
  formatExcelExportTimestamp,
  progressReachDate,
  spanOverlapsChartColumn,
  todayExcelDateOnly,
  toExcelDateOnly,
} from './timeline-chart'
import {
  EXCEL_COMPLETED_MARK,
  EXCEL_CREATOR,
  EXCEL_FONT,
  EXCEL_HEADER_FONT,
  EXCEL_KPI_VALUE_FONT,
  EXCEL_MILESTONE_FONT,
  EXCEL_MILESTONE_MARK,
  EXCEL_MUTED_FONT,
  EXCEL_TITLE_FONT,
  TIMELINE_EXCEL_STATUS_COLORS,
  TIMELINE_EXCEL_STATUS_LEGEND,
  excelSolidFill,
} from './style'

/** Row shape consumed by the shared schedule report workbook. */
export interface ScheduleReportExcelRow {
  wbs: string
  workItem: string
  owner: string
  statusLabel: string
  /** Machine status key used for bar colors */
  statusKey: string
  planStart: string | null
  planEnd: string | null
  dueDate: string | null
  progressPercent: number | null
  varianceLabel: string
  isMilestone?: boolean
  isLeafWork?: boolean
  raw?: Record<string, string | number | null | undefined>
}

export interface ScheduleReportOverview {
  title: string
  narrative: string
  kpis: Array<{ label: string; value: string | number }>
  metaLines?: Array<[string, string | number]>
  lists?: Array<{
    title: string
    headers: string[]
    rows: Array<Array<string | number>>
  }>
}

export interface ScheduleReportWorkbookOptions {
  fileName?: string
  fileNameFallback?: string
  overview: ScheduleReportOverview
  /** Hide technical sheet (default true). */
  hideRawData?: boolean
  today?: string
}

const INFO_HEADERS = [
  '#',
  'Work item',
  'Owner',
  'Status',
  'Plan Start',
  'Plan End',
  'Due date',
  'Progress',
  'Variance',
] as const

const INFO_WIDTHS = [8, 36, 18, 16, 12, 12, 12, 10, 12]

function statusBarColor(statusKey: string): string {
  switch (statusKey) {
    case 'completed':
      return TIMELINE_EXCEL_STATUS_COLORS.completed
    case 'overdue':
    case 'delayed':
      return TIMELINE_EXCEL_STATUS_COLORS.delayed
    case 'at_risk':
    case 'not_started_late':
      return TIMELINE_EXCEL_STATUS_COLORS.atRisk
    case 'in_progress':
      return TIMELINE_EXCEL_STATUS_COLORS.inProgress
    case 'unscheduled':
      return TIMELINE_EXCEL_STATUS_COLORS.unscheduled
    case 'structure':
      return TIMELINE_EXCEL_STATUS_COLORS.structure
    case 'not_started':
    default:
      return TIMELINE_EXCEL_STATUS_COLORS.notStarted
  }
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { ...EXCEL_HEADER_FONT }
  row.alignment = { vertical: 'middle', wrapText: true }
}

function writeLegend(sheet: ExcelJS.Worksheet, startRow: number): number {
  let r = startRow
  sheet.getRow(r).getCell(1).value = 'Legend'
  sheet.getRow(r).font = { ...EXCEL_HEADER_FONT }
  r += 1
  for (const entry of TIMELINE_EXCEL_STATUS_LEGEND) {
    const row = sheet.getRow(r)
    row.getCell(1).fill = excelSolidFill(entry.colorHex)
    row.getCell(2).value = entry.label + (entry.note ? `  ${entry.note}` : '')
    row.getCell(2).font = { ...EXCEL_FONT }
    r += 1
  }
  return r
}

function addOverviewSheet(wb: ExcelJS.Workbook, overview: ScheduleReportOverview) {
  const sheet = wb.addWorksheet('Overview', {
    views: [{ state: 'frozen', ySplit: 2 }],
  })

  sheet.getCell('A1').value = overview.title
  sheet.getCell('A1').font = { ...EXCEL_TITLE_FONT }
  sheet.getCell('A2').value = `Exported ${formatExcelExportTimestamp()}`
  sheet.getCell('A2').font = { ...EXCEL_MUTED_FONT }

  sheet.getCell('A4').value = overview.narrative
  sheet.getCell('A4').font = { ...EXCEL_FONT, size: 12 }
  sheet.mergeCells('A4:F4')
  sheet.getRow(4).alignment = { wrapText: true, vertical: 'top' }
  sheet.getRow(4).height = 36

  let col = 1
  const kpiRow = 6
  for (const kpi of overview.kpis.slice(0, 6)) {
    const cellLabel = sheet.getCell(kpiRow, col)
    const cellValue = sheet.getCell(kpiRow + 1, col)
    cellLabel.value = kpi.label
    cellLabel.font = { ...EXCEL_MUTED_FONT }
    cellValue.value = kpi.value
    cellValue.font = { ...EXCEL_KPI_VALUE_FONT }
    sheet.getColumn(col).width = 18
    col += 1
  }

  let row = 10
  for (const line of overview.metaLines ?? []) {
    sheet.getRow(row).getCell(1).value = line[0]
    sheet.getRow(row).getCell(2).value = line[1]
    sheet.getRow(row).font = { ...EXCEL_FONT }
    row += 1
  }

  row += 1
  for (const list of overview.lists ?? []) {
    sheet.getRow(row).getCell(1).value = list.title
    sheet.getRow(row).font = { ...EXCEL_HEADER_FONT }
    row += 1
    list.headers.forEach((h, i) => {
      const cell = sheet.getRow(row).getCell(i + 1)
      cell.value = h
      cell.font = { ...EXCEL_HEADER_FONT }
    })
    row += 1
    for (const dataRow of list.rows.slice(0, 12)) {
      dataRow.forEach((v, i) => {
        sheet.getRow(row).getCell(i + 1).value = v
        sheet.getRow(row).getCell(i + 1).font = { ...EXCEL_FONT }
      })
      row += 1
    }
    row += 1
  }

  row += 1
  writeLegend(sheet, row)
  sheet.getColumn(1).width = Math.max(sheet.getColumn(1).width ?? 18, 28)
  sheet.getColumn(2).width = 36
  sheet.getColumn(3).width = 16
  sheet.getColumn(4).width = 16
}

function addScheduleSheet(
  wb: ExcelJS.Workbook,
  rows: ScheduleReportExcelRow[],
  today: string
) {
  const spans = rows.map((r) => ({ startDate: r.planStart, endDate: r.planEnd }))
  const { scale, columns } = buildTimelineExcelChartColumns(spans)
  const monthGroups = buildMonthGroups(columns)
  const todayCol = findTodayColumnIndex(columns, today)
  const infoCount = INFO_HEADERS.length

  const sheet = wb.addWorksheet('Schedule', {
    views: [{ state: 'frozen', xSplit: infoCount, ySplit: 2 }],
  })

  // Row 1: title + month bands
  sheet.getCell(1, 1).value = `Schedule · Scale: ${scale} · Today ${formatExcelDisplayDate(today)}`
  sheet.getCell(1, 1).font = { ...EXCEL_HEADER_FONT }
  sheet.mergeCells(1, 1, 1, infoCount)

  monthGroups.forEach((g) => {
    const startCol = infoCount + 1 + g.startIndex
    const endCol = infoCount + 1 + g.endIndex
    const cell = sheet.getCell(1, startCol)
    cell.value = g.label
    cell.font = { ...EXCEL_HEADER_FONT }
    cell.alignment = { horizontal: 'center' }
    if (endCol > startCol) {
      sheet.mergeCells(1, startCol, 1, endCol)
    }
  })

  // Row 2: info headers + day/week labels
  const header = sheet.getRow(2)
  INFO_HEADERS.forEach((h, i) => {
    header.getCell(i + 1).value = h
    sheet.getColumn(i + 1).width = INFO_WIDTHS[i]
  })
  columns.forEach((col, index) => {
    const cell = header.getCell(infoCount + 1 + index)
    cell.value = col.label
    cell.alignment = { horizontal: 'center', wrapText: true }
    sheet.getColumn(infoCount + 1 + index).width = scale === 'day' ? 3.5 : 5
    if (index === todayCol) {
      cell.fill = excelSolidFill(TIMELINE_EXCEL_STATUS_COLORS.todayColumn)
    }
  })
  applyHeaderStyle(header)

  if (columns.length === 0) {
    sheet.getCell(3, 1).value = 'No scheduled dates to plot'
    sheet.getCell(3, 1).font = { ...EXCEL_FONT }
  }

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 3)
    const values = [
      row.wbs,
      row.workItem,
      row.owner || '—',
      row.statusLabel || '—',
      formatExcelDisplayDate(row.planStart),
      formatExcelDisplayDate(row.planEnd),
      formatExcelDisplayDate(row.dueDate),
      row.progressPercent != null ? `${row.progressPercent}%` : '—',
      row.varianceLabel || '—',
    ]
    values.forEach((v, i) => {
      const cell = excelRow.getCell(i + 1)
      cell.value = v
      cell.font = { ...EXCEL_FONT }
      if (i === 1) {
        cell.alignment = { indent: 0 }
      }
    })

    const barColor = statusBarColor(row.statusKey)
    const reach = progressReachDate(row.planStart, row.planEnd, row.progressPercent)
    const planStart = toExcelDateOnly(row.planStart)
    const planEnd = toExcelDateOnly(row.planEnd)

    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(infoCount + 1 + colIndex)
      const isToday = colIndex === todayCol
      if (isToday) {
        cell.fill = excelSolidFill(TIMELINE_EXCEL_STATUS_COLORS.todayColumn)
      }

      const onPlan = spanOverlapsChartColumn(
        { startDate: planStart, endDate: planEnd },
        col
      )

      // Overdue tail: after plan end through today
      const overdueTail =
        (row.statusKey === 'overdue' || row.statusKey === 'delayed') &&
        planEnd &&
        col.start > planEnd &&
        col.start <= today

      if (overdueTail) {
        cell.fill = excelSolidFill(TIMELINE_EXCEL_STATUS_COLORS.overdueTail)
        return
      }

      if (!onPlan) return

      const progressed =
        reach != null &&
        planStart != null &&
        col.start <= reach &&
        col.end >= planStart

      if (row.progressPercent != null && row.progressPercent > 0 && progressed) {
        cell.fill = excelSolidFill(barColor)
      } else if (row.statusKey === 'structure') {
        cell.fill = excelSolidFill(TIMELINE_EXCEL_STATUS_COLORS.structure)
      } else if (row.progressPercent != null && row.progressPercent > 0) {
        cell.fill = excelSolidFill(TIMELINE_EXCEL_STATUS_COLORS.planBaseline)
      } else {
        cell.fill = excelSolidFill(barColor)
      }

      if (row.isMilestone && onPlan) {
        cell.value = EXCEL_MILESTONE_MARK
        cell.alignment = { horizontal: 'center' }
        cell.font = { ...EXCEL_MILESTONE_FONT }
      } else if (row.statusKey === 'completed' && onPlan && colIndex === 0) {
        /* mark first overlapping cell */
      }

      if (
        row.statusKey === 'completed' &&
        onPlan &&
        planEnd &&
        col.start <= planEnd &&
        col.end >= planEnd
      ) {
        cell.value = EXCEL_COMPLETED_MARK
        cell.alignment = { horizontal: 'center' }
        cell.font = { ...EXCEL_MILESTONE_FONT, size: 9 }
      }
    })
  })
}

function addRawDataSheet(
  wb: ExcelJS.Workbook,
  rows: ScheduleReportExcelRow[],
  hidden: boolean
) {
  const sheet = wb.addWorksheet('Raw data')
  const headers = [
    'WBS',
    'Work item',
    'Gantt item ID',
    'Source entity ID',
    'Phase ID',
    'Planning element ID',
    'Assignee user ID',
    'Parent item ID',
    'Schedule status (raw)',
  ]
  headers.forEach((h, i) => {
    sheet.getRow(1).getCell(i + 1).value = h
  })
  applyHeaderStyle(sheet.getRow(1))

  rows.forEach((row, idx) => {
    const r = sheet.getRow(idx + 2)
    const raw = row.raw ?? {}
    const vals = [
      row.wbs,
      row.workItem,
      raw.ganttItemId ?? '',
      raw.sourceEntityId ?? '',
      raw.phaseId ?? '',
      raw.wbsNodeId ?? '',
      raw.assigneeUserId ?? '',
      raw.parentItemId ?? '',
      raw.scheduleStatus ?? '',
    ]
    vals.forEach((v, i) => {
      r.getCell(i + 1).value = v == null ? '' : String(v)
      r.getCell(i + 1).font = { ...EXCEL_FONT }
    })
  })

  headers.forEach((_, i) => {
    sheet.getColumn(i + 1).width = i <= 1 ? 28 : 36
  })

  if (hidden) {
    sheet.state = 'hidden'
  }
}

/**
 * Decision-support workbook: Overview + Schedule (info + Gantt) + hidden Raw data.
 * Style: `shared/lib/excel/style.ts`.
 */
export async function downloadScheduleReportWorkbook(
  rows: ScheduleReportExcelRow[],
  opts: ScheduleReportWorkbookOptions
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = EXCEL_CREATOR
  wb.created = new Date()
  const today = opts.today ?? todayExcelDateOnly()

  addOverviewSheet(wb, opts.overview)
  addScheduleSheet(wb, rows, today)
  addRawDataSheet(wb, rows, opts.hideRawData !== false)

  const buffer = await wb.xlsx.writeBuffer()
  const bytes = excelWriteBufferToArrayBuffer(buffer)
  const stem = safeExcelFileStem(
    opts.fileName ?? opts.overview.title,
    opts.fileNameFallback ?? 'schedule-report'
  )
  triggerBrowserDownload(bytes, `${stem}.xlsx`)
}

/* ------------------------------------------------------------------ */
/* Legacy thin API — maps old list+chart exports onto the report shape */
/* ------------------------------------------------------------------ */

export interface TimelineExcelListColumn {
  key: string
  header: string
  width?: number
}

export interface TimelineExcelRow {
  typeLabel: string
  title: string
  depth?: number
  scheduleStatus?: string
  startDate: string | null
  endDate: string | null
  fillHex: string
  isMilestone?: boolean
  cells?: Record<string, string | number | null | undefined>
}

export interface TimelineExcelWorkbookOptions {
  title?: string | null
  fileName?: string
  fileNameFallback?: string
  listSheetName?: string
  chartSheetName?: string
  listColumns?: TimelineExcelListColumn[]
  legend?: Array<{ label: string; swatch: string }>
  summaryLines?: Array<[string, string | number]>
}

/** @deprecated Prefer downloadScheduleReportWorkbook for decision-support exports. */
export async function downloadTimelineExcelWorkbook(
  rows: TimelineExcelRow[],
  opts: TimelineExcelWorkbookOptions = {}
): Promise<void> {
  const reportRows: ScheduleReportExcelRow[] = rows.map((r, i) => ({
    wbs: String(i + 1),
    workItem: r.title,
    owner: String(r.cells?.person ?? r.cells?.owner ?? '—'),
    statusLabel: r.scheduleStatus === 'NOT_APPLICABLE' ? '—' : r.scheduleStatus ?? '—',
    statusKey: 'in_progress',
    planStart: r.startDate,
    planEnd: r.endDate,
    dueDate: r.endDate,
    progressPercent: null,
    varianceLabel: '—',
    isMilestone: r.isMilestone,
    isLeafWork: true,
    raw: {
      scheduleStatus: r.scheduleStatus ?? '',
      phaseId: r.cells?.phaseId ?? '',
      wbsNodeId: r.cells?.wbsNodeId ?? '',
      assigneeUserId: r.cells?.assignee ?? '',
      project: r.cells?.project ?? '',
    },
  }))

  await downloadScheduleReportWorkbook(reportRows, {
    fileName: opts.fileName ?? opts.title ?? undefined,
    fileNameFallback: opts.fileNameFallback ?? 'timeline',
    overview: {
      title: opts.title ?? 'Schedule',
      narrative: 'Exported schedule snapshot.',
      kpis: (opts.summaryLines ?? []).map(([label, value]) => ({
        label,
        value,
      })),
    },
  })
}
