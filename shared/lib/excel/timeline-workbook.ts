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
  EXCEL_CREATOR,
  EXCEL_FONT,
  EXCEL_FONT_NAME,
  EXCEL_HEADER_FONT,
  EXCEL_KPI_VALUE_FONT,
  EXCEL_MUTED_FONT,
  EXCEL_TITLE_FONT,
  TIMELINE_EXCEL_LEVEL,
  TIMELINE_EXCEL_LEVEL_LEGEND,
  TIMELINE_EXCEL_STATUS_LEGEND,
  TIMELINE_EXCEL_STATUS_TEXT,
  TIMELINE_EXCEL_UI,
  excelFontColor,
  excelSolidFill,
  scheduleExcelLevelFromItemType,
  type ScheduleExcelLevel,
} from './style'

/** Row shape consumed by the shared schedule report workbook. */
export interface ScheduleReportExcelRow {
  wbs: string
  workItem: string
  owner: string
  statusLabel: string
  /** Machine status key — text styling only */
  statusKey: string
  planStart: string | null
  planEnd: string | null
  dueDate?: string | null
  progressPercent: number | null
  varianceLabel: string
  /** PROJECT | PHASE | WBS_NODE | TASK | MILESTONE */
  itemType?: string
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
  'WBS',
  'Work item',
  'Owner',
  'Status',
  'Plan Start',
  'Plan End',
  'Progress',
  'Variance',
] as const

const INFO_WIDTHS = [10, 40, 18, 16, 12, 12, 10, 14]

const STATUS_COL = 4
const VARIANCE_COL = 8
const WORK_ITEM_COL = 2

function thinBorder(color = TIMELINE_EXCEL_UI.gridLine): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = {
    style: 'thin',
    color: { argb: `FF${color}` },
  }
  return { top: edge, bottom: edge, left: edge, right: edge }
}

function statusStyleKey(statusKey: string): keyof typeof TIMELINE_EXCEL_STATUS_TEXT {
  if (statusKey in TIMELINE_EXCEL_STATUS_TEXT) {
    return statusKey as keyof typeof TIMELINE_EXCEL_STATUS_TEXT
  }
  if (statusKey === 'structure') return 'structure'
  return 'not_started'
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { ...EXCEL_HEADER_FONT }
  row.alignment = { vertical: 'middle', wrapText: true }
  row.eachCell((cell) => {
    cell.fill = excelSolidFill(TIMELINE_EXCEL_UI.headerBg)
    cell.border = {
      bottom: {
        style: 'medium',
        color: { argb: `FF${TIMELINE_EXCEL_UI.phaseBorder}` },
      },
    }
  })
}

function writeLegend(sheet: ExcelJS.Worksheet, startRow: number): number {
  let r = startRow
  sheet.getRow(r).getCell(1).value = 'Hierarchy (Gantt bars)'
  sheet.getRow(r).font = { ...EXCEL_HEADER_FONT }
  r += 1
  for (const entry of TIMELINE_EXCEL_LEVEL_LEGEND) {
    const row = sheet.getRow(r)
    row.getCell(1).fill = excelSolidFill(entry.colorHex)
    row.getCell(2).value = entry.label
    row.getCell(2).font = { ...EXCEL_FONT }
    r += 1
  }
  r += 1
  sheet.getRow(r).getCell(1).value = 'Status (text color)'
  sheet.getRow(r).font = { ...EXCEL_HEADER_FONT }
  r += 1
  for (const entry of TIMELINE_EXCEL_STATUS_LEGEND) {
    const row = sheet.getRow(r)
    row.getCell(1).fill = excelSolidFill(entry.colorHex)
    row.getCell(2).value = entry.label
    row.getCell(2).font = {
      ...EXCEL_FONT,
      color: excelFontColor(entry.colorHex),
    }
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

function applyInfoRowStyle(
  excelRow: ExcelJS.Row,
  level: ScheduleExcelLevel,
  statusKey: string,
  infoCount: number
) {
  const cfg = TIMELINE_EXCEL_LEVEL[level]
  excelRow.height = cfg.rowHeight

  for (let c = 1; c <= infoCount; c++) {
    const cell = excelRow.getCell(c)
    cell.fill = excelSolidFill(cfg.rowBg)
    cell.font = {
      name: EXCEL_FONT_NAME,
      size: cfg.fontSize,
      bold: cfg.bold || (c === STATUS_COL && (statusKey === 'delayed' || statusKey === 'overdue')),
      color: excelFontColor(cfg.text),
    }
    cell.alignment = {
      vertical: 'middle',
      indent: c === WORK_ITEM_COL ? cfg.indent : 0,
    }

    if (level === 'project') {
      cell.border = {
        top: {
          style: 'medium',
          color: { argb: `FF${TIMELINE_EXCEL_UI.projectBorder}` },
        },
        bottom: {
          style: 'medium',
          color: { argb: `FF${TIMELINE_EXCEL_UI.projectBorder}` },
        },
      }
    } else if (level === 'phase') {
      cell.border = {
        top: {
          style: 'thin',
          color: { argb: `FF${TIMELINE_EXCEL_UI.phaseBorder}` },
        },
        bottom: {
          style: 'hair',
          color: { argb: `FF${TIMELINE_EXCEL_UI.gridLine}` },
        },
      }
    } else {
      cell.border = {
        bottom: {
          style: 'hair',
          color: { argb: `FF${TIMELINE_EXCEL_UI.gridLine}` },
        },
      }
    }
  }

  // Status + Variance: status text color (light tint on status only)
  const st = TIMELINE_EXCEL_STATUS_TEXT[statusStyleKey(statusKey)]
  if (level !== 'project') {
    const statusCell = excelRow.getCell(STATUS_COL)
    statusCell.font = {
      name: EXCEL_FONT_NAME,
      size: cfg.fontSize,
      bold: statusKey === 'delayed' || statusKey === 'overdue',
      color: excelFontColor(st.text),
    }
    if (st.bg !== 'FFFFFF') {
      statusCell.fill = excelSolidFill(st.bg)
    }

    const varianceCell = excelRow.getCell(VARIANCE_COL)
    varianceCell.font = {
      name: EXCEL_FONT_NAME,
      size: cfg.fontSize,
      bold: statusKey === 'delayed' || statusKey === 'overdue',
      color: excelFontColor(st.text),
    }
  }
}

function paintGanttCell(
  cell: ExcelJS.Cell,
  level: ScheduleExcelLevel,
  opts: {
    progressed: boolean
    hasProgress: boolean
    isMilestone: boolean
    isToday: boolean
  }
) {
  const cfg = TIMELINE_EXCEL_LEVEL[level]

  if (opts.isToday && !opts.progressed && level === 'task') {
    cell.fill = excelSolidFill(TIMELINE_EXCEL_UI.todayColumn)
  }

  if (opts.isMilestone) {
    // Small solid block — no icon
    cell.fill = excelSolidFill(TIMELINE_EXCEL_UI.milestoneMark)
    return
  }

  if (level === 'project' || level === 'phase' || level === 'plan') {
    cell.fill = excelSolidFill(cfg.bar)
    return
  }

  // Task: progress darker, remainder light
  if (opts.hasProgress) {
    cell.fill = excelSolidFill(
      opts.progressed ? cfg.barProgress : TIMELINE_EXCEL_LEVEL.task.barRemain
    )
  } else {
    cell.fill = excelSolidFill(cfg.bar)
  }
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
    properties: { defaultRowHeight: 18 },
  })

  sheet.getCell(1, 1).value =
    `Schedule · Scale: ${scale} · Today ${formatExcelDisplayDate(today)}`
  sheet.getCell(1, 1).font = { ...EXCEL_HEADER_FONT }
  sheet.mergeCells(1, 1, 1, infoCount)
  sheet.getRow(1).height = 22

  monthGroups.forEach((g) => {
    const startCol = infoCount + 1 + g.startIndex
    const endCol = infoCount + 1 + g.endIndex
    const cell = sheet.getCell(1, startCol)
    cell.value = g.label
    cell.font = { ...EXCEL_HEADER_FONT }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = excelSolidFill(TIMELINE_EXCEL_UI.headerBg)
    if (endCol > startCol) {
      sheet.mergeCells(1, startCol, 1, endCol)
    }
  })

  const header = sheet.getRow(2)
  INFO_HEADERS.forEach((h, i) => {
    header.getCell(i + 1).value = h
    sheet.getColumn(i + 1).width = INFO_WIDTHS[i]
  })
  columns.forEach((col, index) => {
    const cell = header.getCell(infoCount + 1 + index)
    cell.value = col.label
    cell.alignment = { horizontal: 'center', wrapText: true, vertical: 'middle' }
    sheet.getColumn(infoCount + 1 + index).width = scale === 'day' ? 3.2 : 4.5
    if (index === todayCol) {
      cell.fill = excelSolidFill(TIMELINE_EXCEL_UI.todayColumn)
    }
  })
  applyHeaderStyle(header)
  header.height = 24

  if (columns.length === 0) {
    sheet.getCell(3, 1).value = 'No scheduled dates to plot'
    sheet.getCell(3, 1).font = { ...EXCEL_FONT }
  }

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 3)
    const level = scheduleExcelLevelFromItemType(row.itemType)
    const values = [
      row.wbs,
      row.workItem,
      row.owner || '—',
      row.statusLabel || '—',
      formatExcelDisplayDate(row.planStart),
      formatExcelDisplayDate(row.planEnd),
      row.progressPercent != null ? `${row.progressPercent}%` : '—',
      row.varianceLabel || '—',
    ]
    values.forEach((v, i) => {
      excelRow.getCell(i + 1).value = v
    })
    applyInfoRowStyle(excelRow, level, row.statusKey, infoCount)

    const reach = progressReachDate(row.planStart, row.planEnd, row.progressPercent)
    const planStart = toExcelDateOnly(row.planStart)
    const planEnd = toExcelDateOnly(row.planEnd)
    const hasProgress = row.progressPercent != null && row.progressPercent > 0

    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(infoCount + 1 + colIndex)
      const isToday = colIndex === todayCol

      // Soft today highlight under empty cells
      if (isToday) {
        cell.fill = excelSolidFill(TIMELINE_EXCEL_UI.todayColumn)
      }

      const onPlan = spanOverlapsChartColumn(
        { startDate: planStart, endDate: planEnd },
        col
      )

      const overdueTail =
        (row.statusKey === 'overdue' || row.statusKey === 'delayed') &&
        planEnd &&
        col.start > planEnd &&
        col.start <= today

      if (overdueTail) {
        cell.fill = excelSolidFill(TIMELINE_EXCEL_UI.overdueTail)
        return
      }

      if (!onPlan) return

      const progressed =
        reach != null &&
        planStart != null &&
        col.start <= reach &&
        col.end >= planStart

      paintGanttCell(cell, level, {
        progressed,
        hasProgress,
        isMilestone: Boolean(row.isMilestone),
        isToday,
      })
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
      r.getCell(i + 1).border = thinBorder()
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
 * Style: `shared/lib/excel/style.ts` — corporate, flat, no icons.
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
/* Legacy thin API                                                     */
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

/** @deprecated Prefer downloadScheduleReportWorkbook. */
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
    progressPercent: null,
    varianceLabel: '—',
    itemType: 'TASK',
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
