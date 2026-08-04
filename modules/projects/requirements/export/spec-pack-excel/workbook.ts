import ExcelJS from 'exceljs'
import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import {
  flattenSpecPackForExcel,
  type SpecPackExcelAcRow,
  type SpecPackExcelBrRow,
  type SpecPackExcelDashboardStats,
  type SpecPackExcelFlat,
  type SpecPackExcelScopeRow,
  type SpecPackExcelTechnicalRow,
} from './rows'

const FONT: Partial<ExcelJS.Font> = { name: 'Century Gothic', size: 10 }
const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 10,
  bold: true,
  color: { argb: 'FF1F2937' },
}
const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 14,
  bold: true,
  color: { argb: 'FF111827' },
}
const SECTION_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 11,
  bold: true,
  color: { argb: 'FF374151' },
}
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE5E7EB' },
}
const KPI_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
}

const GROUP_FILLS = [
  'FFEFF6FF',
  'FFF0FDF4',
  'FFFFF7ED',
  'FFF5F3FF',
  'FFFDF2F8',
] as const

const PRIORITY_FILL: Record<string, string> = {
  critical: 'FFFEE2E2',
  high: 'FFFFEDD5',
  medium: 'FFFEF9C3',
  low: 'FFF3F4F6',
}

const SHEET = {
  scope: 'Scope Overview',
  ac: 'Acceptance Criteria',
  br: 'Business Rules',
  dashboard: 'Dashboard',
  technical: 'Technical Data',
  links: 'Linked artifacts',
  useCases: 'Use cases',
} as const

function styleHeaderRow(sheet: ExcelJS.Worksheet, columnCount: number): void {
  const row = sheet.getRow(1)
  row.height = 22
  row.font = HEADER_FONT
  for (let c = 1; c <= columnCount; c++) {
    const cell = row.getCell(c)
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'left' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    }
  }
}

function applyBodyDefaults(sheet: ExcelJS.Worksheet): void {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.font = FONT
    row.alignment = { vertical: 'top', wrapText: true }
  })
}

function priorityFillArgb(priority: string): string | null {
  const key = priority.trim().toLowerCase()
  if (!key) return null
  for (const [token, fill] of Object.entries(PRIORITY_FILL)) {
    if (key.includes(token)) return fill
  }
  return null
}

function groupFillIndex(group: string, cache: Map<string, number>): number {
  if (!cache.has(group)) cache.set(group, cache.size % GROUP_FILLS.length)
  return cache.get(group)!
}

function paintPriorityAndGroup(
  sheet: ExcelJS.Worksheet,
  rows: Array<{ group: string; priority: string }>,
  groupCol: number,
  priorityCol: number
): void {
  const groupCache = new Map<string, number>()
  rows.forEach((r, i) => {
    const excelRow = i + 2
    const gFill = GROUP_FILLS[groupFillIndex(r.group, groupCache)]!
    sheet.getRow(excelRow).getCell(groupCol).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: gFill },
    }
    const pFill = priorityFillArgb(r.priority)
    if (pFill) {
      sheet.getRow(excelRow).getCell(priorityCol).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: pFill },
      }
    }
  })
}

function configureTableSheet(
  sheet: ExcelJS.Worksheet,
  opts: {
    columnCount: number
    freezeCols?: number
  }
): void {
  styleHeaderRow(sheet, opts.columnCount)
  applyBodyDefaults(sheet)
  sheet.views = [
    {
      state: 'frozen',
      xSplit: opts.freezeCols ?? 2,
      ySplit: 1,
      showGridLines: false,
      activeCell: 'A2',
    },
  ]
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: opts.columnCount },
  }
}

function addScopeOverviewSheet(
  wb: ExcelJS.Workbook,
  rows: SpecPackExcelScopeRow[],
  firstAcRowByReq: Map<string, number>
): void {
  const sheet = wb.addWorksheet(SHEET.scope)
  sheet.columns = [
    { header: 'Group', key: 'group', width: 20 },
    { header: 'Area', key: 'area', width: 22 },
    { header: 'Req. Code', key: 'reqCode', width: 14 },
    { header: 'Requirement', key: 'requirement', width: 36 },
    { header: 'Business Description', key: 'description', width: 58 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
  ]

  rows.forEach((r, i) => {
    const excelRow = i + 2
    sheet.addRow(r)
    const acTarget = firstAcRowByReq.get(r.reqCode)
    const codeCell = sheet.getRow(excelRow).getCell(3)
    if (acTarget) {
      codeCell.value = {
        text: r.reqCode,
        hyperlink: `#'${SHEET.ac}'!A${acTarget}`,
      }
      codeCell.font = {
        ...FONT,
        color: { argb: 'FF1D4ED8' },
        underline: true,
      }
    }
  })

  configureTableSheet(sheet, { columnCount: 8, freezeCols: 3 })
  paintPriorityAndGroup(sheet, rows, 1, 6)
}

function addAcceptanceCriteriaSheet(
  wb: ExcelJS.Workbook,
  rows: SpecPackExcelAcRow[]
): Map<string, number> {
  const sheet = wb.addWorksheet(SHEET.ac)
  sheet.columns = [
    { header: 'Group', key: 'group', width: 20 },
    { header: 'Req. Code', key: 'reqCode', width: 14 },
    { header: 'Requirement', key: 'requirement', width: 32 },
    { header: 'AC #', key: 'acNo', width: 8 },
    { header: 'Acceptance Criterion', key: 'criterion', width: 64 },
    { header: 'Function', key: 'functionCode', width: 14 },
  ]

  const firstAcRowByReq = new Map<string, number>()
  rows.forEach((r, i) => {
    const excelRow = i + 2
    if (!firstAcRowByReq.has(r.reqCode)) firstAcRowByReq.set(r.reqCode, excelRow)
    sheet.addRow(r)
  })

  configureTableSheet(sheet, { columnCount: 6, freezeCols: 2 })

  const groupCache = new Map<string, number>()
  rows.forEach((r, i) => {
    const gFill = GROUP_FILLS[groupFillIndex(r.group, groupCache)]!
    sheet.getRow(i + 2).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: gFill },
    }
  })

  return firstAcRowByReq
}

function addBusinessRulesSheet(
  wb: ExcelJS.Workbook,
  rows: SpecPackExcelBrRow[]
): void {
  const sheet = wb.addWorksheet(SHEET.br)
  sheet.columns = [
    { header: 'Group', key: 'group', width: 20 },
    { header: 'Req. Code', key: 'reqCode', width: 14 },
    { header: 'BR Code', key: 'brCode', width: 14 },
    { header: 'Business Rule', key: 'businessRule', width: 32 },
    { header: 'Detail', key: 'detail', width: 56 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Function', key: 'functionCode', width: 14 },
  ]
  for (const r of rows) sheet.addRow(r)

  configureTableSheet(sheet, { columnCount: 8, freezeCols: 2 })
  paintPriorityAndGroup(
    sheet,
    rows.map((r) => ({ group: r.group, priority: r.priority })),
    1,
    6
  )
}

function addDashboardSheet(
  wb: ExcelJS.Workbook,
  stats: SpecPackExcelDashboardStats
): void {
  const sheet = wb.addWorksheet(SHEET.dashboard)
  sheet.views = [{ showGridLines: false }]
  sheet.getColumn(1).width = 28
  sheet.getColumn(2).width = 18
  sheet.getColumn(3).width = 8
  sheet.getColumn(4).width = 28
  sheet.getColumn(5).width = 12

  sheet.getCell('A1').value = stats.title
  sheet.getCell('A1').font = TITLE_FONT
  sheet.getCell('A2').value = `Generated ${stats.generatedAt}`
  sheet.getCell('A2').font = { ...FONT, color: { argb: 'FF6B7280' } }

  const kpis: Array<[string, number]> = [
    ['Requirements', stats.requirementCount],
    ['Functions', stats.functionCount],
    ['Acceptance criteria', stats.acceptanceCriteriaCount],
    ['Business rules', stats.businessRulesCount],
  ]

  sheet.getCell('A4').value = 'Overview'
  sheet.getCell('A4').font = SECTION_FONT

  kpis.forEach(([label, value], i) => {
    const row = 5 + i
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`B${row}`).value = value
    sheet.getCell(`A${row}`).font = FONT
    sheet.getCell(`B${row}`).font = {
      ...FONT,
      bold: true,
      size: 12,
    }
    sheet.getCell(`A${row}`).fill = KPI_FILL
    sheet.getCell(`B${row}`).fill = KPI_FILL
  })

  const writeBreakdown = (
    startCol: number,
    title: string,
    items: Array<{ label: string; count: number }>,
    startRow: number
  ) => {
    const labelCell = sheet.getCell(startRow, startCol)
    labelCell.value = title
    labelCell.font = SECTION_FONT
    sheet.getCell(startRow + 1, startCol).value = 'Name'
    sheet.getCell(startRow + 1, startCol + 1).value = 'Count'
    sheet.getCell(startRow + 1, startCol).font = HEADER_FONT
    sheet.getCell(startRow + 1, startCol + 1).font = HEADER_FONT
    sheet.getCell(startRow + 1, startCol).fill = HEADER_FILL
    sheet.getCell(startRow + 1, startCol + 1).fill = HEADER_FILL
    items.forEach((item, i) => {
      const row = startRow + 2 + i
      sheet.getCell(row, startCol).value = item.label
      sheet.getCell(row, startCol + 1).value = item.count
      sheet.getCell(row, startCol).font = FONT
      sheet.getCell(row, startCol + 1).font = FONT
    })
  }

  writeBreakdown(1, 'By group', stats.byGroup, 11)
  writeBreakdown(4, 'By priority', stats.byPriority, 11)

  const typeStart =
    11 + Math.max(stats.byGroup.length, stats.byPriority.length, 1) + 3
  writeBreakdown(1, 'By type', stats.byType, typeStart)
}

function addTechnicalDataSheet(
  wb: ExcelJS.Workbook,
  doc: SpecPackPreviewDocument,
  rows: SpecPackExcelTechnicalRow[]
): void {
  const sheet = wb.addWorksheet(SHEET.technical)
  sheet.state = 'hidden'
  sheet.columns = [
    { header: 'Group', key: 'group', width: 18 },
    { header: 'Req. Code', key: 'reqCode', width: 14 },
    { header: 'Requirement', key: 'requirementTitle', width: 28 },
    { header: 'Requirement ID', key: 'requirementId', width: 36 },
    { header: 'Function code', key: 'functionCode', width: 14 },
    { header: 'Function name', key: 'functionName', width: 28 },
    { header: 'Function ID', key: 'functionId', width: 36 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created', key: 'createdAt', width: 18 },
    { header: 'Updated', key: 'updatedAt', width: 18 },
    { header: 'Load error', key: 'loadError', width: 20 },
    { header: 'Group ID', key: 'groupId', width: 36 },
    { header: 'Pack ID', key: 'packId', width: 36 },
    { header: 'Project ID', key: 'projectId', width: 36 },
    { header: 'Pack note', key: 'note', width: 24 },
  ]

  for (const r of rows) {
    sheet.addRow({
      ...r,
      note: doc.note ?? '',
    })
  }

  configureTableSheet(sheet, { columnCount: 18, freezeCols: 2 })
}

function addOptionalLinksSheet(
  wb: ExcelJS.Workbook,
  rows: SpecPackExcelFlat['linkRows']
): void {
  if (rows.length === 0) return
  const sheet = wb.addWorksheet(SHEET.links)
  sheet.columns = [
    { header: 'Requirement', key: 'requirementCode', width: 14 },
    { header: 'Function code', key: 'functionCode', width: 14 },
    { header: 'Function name', key: 'functionName', width: 28 },
    { header: 'Artifact type', key: 'artifactType', width: 14 },
    { header: 'Code', key: 'code', width: 14 },
    { header: 'Name', key: 'name', width: 32 },
    { header: 'Secondary', key: 'secondary', width: 24 },
  ]
  for (const r of rows) sheet.addRow(r)
  configureTableSheet(sheet, { columnCount: 7, freezeCols: 2 })
}

function addOptionalUseCasesSheet(
  wb: ExcelJS.Workbook,
  rows: SpecPackExcelFlat['useCaseRows']
): void {
  if (rows.length === 0) return
  const sheet = wb.addWorksheet(SHEET.useCases)
  sheet.columns = [
    { header: 'Requirement', key: 'requirementCode', width: 14 },
    { header: 'Function', key: 'functionCode', width: 14 },
    { header: 'UC key', key: 'useCaseKey', width: 14 },
    { header: 'UC name', key: 'useCaseName', width: 28 },
    { header: 'Goal', key: 'goal', width: 36 },
    { header: 'Primary actor', key: 'primaryActor', width: 18 },
    { header: 'Trigger', key: 'trigger', width: 28 },
    { header: 'Conditions', key: 'conditions', width: 36 },
    { header: 'Business rules', key: 'businessRules', width: 36 },
    { header: 'Acceptance criteria', key: 'acceptanceCriteria', width: 40 },
    { header: 'Flows', key: 'flows', width: 40 },
  ]
  for (const r of rows) sheet.addRow(r)
  configureTableSheet(sheet, { columnCount: 11, freezeCols: 2 })
}

export function suggestSpecPackExcelFilename(doc: SpecPackPreviewDocument): string {
  const safe = doc.title
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${safe || 'spec-pack'}-scope.xlsx`
}

/** Precompute AC row map without adding a sheet (stable row numbers). */
function buildFirstAcRowByReq(rows: SpecPackExcelAcRow[]): Map<string, number> {
  const map = new Map<string, number>()
  rows.forEach((r, i) => {
    if (!map.has(r.reqCode)) map.set(r.reqCode, i + 2)
  })
  return map
}

/** Build stakeholder-oriented Spec Pack workbook. */
export async function buildSpecPackExcelWorkbook(
  doc: SpecPackPreviewDocument
): Promise<ExcelJS.Workbook> {
  const flat = flattenSpecPackForExcel(doc)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scopery'
  wb.created = new Date()

  const firstAcRowByReq = buildFirstAcRowByReq(flat.acRows)
  addScopeOverviewSheet(wb, flat.scopeRows, firstAcRowByReq)
  addAcceptanceCriteriaSheet(wb, flat.acRows)
  addBusinessRulesSheet(wb, flat.brRows)
  addDashboardSheet(wb, flat.dashboard)
  addTechnicalDataSheet(wb, doc, flat.technicalRows)
  addOptionalLinksSheet(wb, flat.linkRows)
  addOptionalUseCasesSheet(wb, flat.useCaseRows)

  return wb
}
