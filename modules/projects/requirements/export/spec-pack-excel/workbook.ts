import ExcelJS from 'exceljs'
import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import {
  addFunctionViewSheet,
  addRequirementViewSheet,
  addTraceabilitySheet,
  addUseCaseViewSheet,
  BUSINESS_SHEET,
} from './business-views'
import {
  flattenSpecPackForExcel,
  type SpecPackExcelFlat,
  type SpecPackExcelSummaryStats,
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
const LOOKUP_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
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

/** Normalized storage sheets — hidden; business reads View sheets instead. */
const DATA_SHEET = {
  requirements: 'Requirements_Data',
  functions: 'Functions_Data',
  reqFnLinks: 'Requirement_Function_Links',
  fnAc: 'Function_AC_Data',
  fnBr: 'Function_BR_Data',
  useCases: 'UseCases_Data',
  fnUcLinks: 'Function_UseCase_Links',
  ucConditions: 'UC_Conditions_Data',
  ucFlows: 'UC_Flows_Data',
  ucSteps: 'UC_Steps_Data',
  ucBr: 'UC_BR_Data',
  ucAc: 'UC_AC_Data',
  technical: 'Technical Metadata',
} as const

type ColDef = { header: string; key: string; width: number; lookup?: boolean }

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

function configureTableSheet(
  sheet: ExcelJS.Worksheet,
  opts: { columnCount: number; freezeCols?: number }
): void {
  styleHeaderRow(sheet, opts.columnCount)
  applyBodyDefaults(sheet)
  sheet.views = [
    {
      state: 'frozen',
      xSplit: opts.freezeCols ?? 1,
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

function paintLookupColumns(
  sheet: ExcelJS.Worksheet,
  cols: ColDef[],
  rowCount: number
): void {
  cols.forEach((col, i) => {
    if (!col.lookup) return
    const c = i + 1
    for (let r = 2; r <= rowCount + 1; r++) {
      sheet.getRow(r).getCell(c).fill = LOOKUP_FILL
    }
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

function addDataSheet(
  wb: ExcelJS.Workbook,
  name: string,
  cols: ColDef[],
  rows: Record<string, unknown>[],
  opts?: {
    freezeCols?: number
    paintGroupPriority?: boolean
    hidden?: boolean
  }
): void {
  const sheet = wb.addWorksheet(name)
  if (opts?.hidden !== false) sheet.state = 'hidden'
  sheet.columns = cols.map(({ header, key, width }) => ({ header, key, width }))
  for (const row of rows) sheet.addRow(row)
  configureTableSheet(sheet, {
    columnCount: cols.length,
    freezeCols: opts?.freezeCols ?? 1,
  })
  paintLookupColumns(sheet, cols, rows.length)

  if (opts?.paintGroupPriority) {
    const groupCol = cols.findIndex((c) => c.key === 'group') + 1
    const priorityCol = cols.findIndex((c) => c.key === 'priority') + 1
    const groupCache = new Map<string, number>()
    rows.forEach((row, i) => {
      const excelRow = i + 2
      if (groupCol > 0) {
        const group = String(row.group ?? '')
        const gFill = GROUP_FILLS[groupFillIndex(group, groupCache)]!
        sheet.getRow(excelRow).getCell(groupCol).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: gFill },
        }
      }
      if (priorityCol > 0) {
        const pFill = priorityFillArgb(String(row.priority ?? ''))
        if (pFill) {
          sheet.getRow(excelRow).getCell(priorityCol).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: pFill },
          }
        }
      }
    })
  }
}

function addSummarySheet(
  wb: ExcelJS.Workbook,
  stats: SpecPackExcelSummaryStats
): void {
  const sheet = wb.addWorksheet('Summary')
  sheet.views = [{ showGridLines: false }]
  sheet.getColumn(1).width = 32
  sheet.getColumn(2).width = 18
  sheet.getColumn(3).width = 8
  sheet.getColumn(4).width = 28
  sheet.getColumn(5).width = 12

  sheet.getCell('A1').value = stats.title
  sheet.getCell('A1').font = TITLE_FONT
  sheet.getCell('A2').value = `Generated ${stats.generatedAt}`
  sheet.getCell('A2').font = { ...FONT, color: { argb: 'FF6B7280' } }

  sheet.getCell('A4').value = 'Overview'
  sheet.getCell('A4').font = SECTION_FONT

  const kpis: Array<[string, number]> = [
    ['Requirements', stats.requirementCount],
    ['Functions (unique)', stats.uniqueFunctionCount],
    ['Use cases', stats.useCaseCount],
    ['Requirement–Function links', stats.reqFnLinkCount],
    ['Function–Use Case links', stats.fnUcLinkCount],
  ]

  kpis.forEach(([label, value], i) => {
    const row = 5 + i
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`B${row}`).value = value
    sheet.getCell(`A${row}`).font = FONT
    sheet.getCell(`B${row}`).font = { ...FONT, bold: true, size: 12 }
    sheet.getCell(`A${row}`).fill = KPI_FILL
    sheet.getCell(`B${row}`).fill = KPI_FILL
  })

  const writeBreakdown = (
    startCol: number,
    title: string,
    items: Array<{ label: string; count: number }>,
    startRow: number
  ) => {
    sheet.getCell(startRow, startCol).value = title
    sheet.getCell(startRow, startCol).font = SECTION_FONT
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

  writeBreakdown(1, 'By group', stats.byGroup, 12)
  writeBreakdown(4, 'By priority', stats.byPriority, 12)
  const typeStart =
    12 + Math.max(stats.byGroup.length, stats.byPriority.length, 1) + 3
  writeBreakdown(1, 'By type', stats.byType, typeStart)
}

function addNormalizedDataSheets(wb: ExcelJS.Workbook, flat: SpecPackExcelFlat): void {
  addDataSheet(
    wb,
    DATA_SHEET.requirements,
    [
      { header: 'Group', key: 'group', width: 20 },
      { header: 'Code', key: 'code', width: 14 },
      { header: 'Title', key: 'title', width: 36 },
      { header: 'Requirement Type', key: 'requirementType', width: 16 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Description', key: 'description', width: 58 },
    ],
    flat.requirements,
    { freezeCols: 2, paintGroupPriority: true }
  )

  addDataSheet(
    wb,
    DATA_SHEET.functions,
    [
      { header: 'Function Code', key: 'functionCode', width: 14 },
      { header: 'Title', key: 'title', width: 36 },
      { header: 'Description', key: 'description', width: 58 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Type', key: 'type', width: 14 },
    ],
    flat.functions,
    { freezeCols: 1, paintGroupPriority: true }
  )

  addDataSheet(
    wb,
    DATA_SHEET.reqFnLinks,
    [
      { header: 'Requirement Code', key: 'requirementCode', width: 16 },
      {
        header: 'Requirement Title',
        key: 'requirementTitle',
        width: 32,
        lookup: true,
      },
      { header: 'Function Code', key: 'functionCode', width: 14 },
      { header: 'Function Title', key: 'functionTitle', width: 32, lookup: true },
    ],
    flat.reqFnLinks
  )

  addDataSheet(
    wb,
    DATA_SHEET.fnAc,
    [
      { header: 'Function Code', key: 'functionCode', width: 14 },
      { header: 'AC No.', key: 'acNo', width: 8 },
      { header: 'Acceptance Criterion', key: 'criterion', width: 64 },
    ],
    flat.fnAcceptanceCriteria
  )

  addDataSheet(
    wb,
    DATA_SHEET.fnBr,
    [
      { header: 'Function Code', key: 'functionCode', width: 14 },
      { header: 'Rule Code', key: 'ruleCode', width: 12 },
      { header: 'Rule Title', key: 'ruleTitle', width: 28 },
      { header: 'Severity', key: 'severity', width: 12 },
      { header: 'Description', key: 'description', width: 56 },
    ],
    flat.fnBusinessRules,
    { freezeCols: 2 }
  )

  addDataSheet(
    wb,
    DATA_SHEET.useCases,
    [
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Goal', key: 'goal', width: 40 },
      { header: 'Primary Actor', key: 'primaryActor', width: 18 },
      { header: 'Trigger', key: 'trigger', width: 36 },
    ],
    flat.useCases
  )

  addDataSheet(
    wb,
    DATA_SHEET.fnUcLinks,
    [
      { header: 'Function Code', key: 'functionCode', width: 14 },
      { header: 'Function Title', key: 'functionTitle', width: 28, lookup: true },
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'Use Case Name', key: 'useCaseName', width: 28, lookup: true },
    ],
    flat.fnUcLinks
  )

  addDataSheet(
    wb,
    DATA_SHEET.ucConditions,
    [
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'Sequence', key: 'sequence', width: 10 },
      { header: 'Condition Type', key: 'conditionType', width: 22 },
      { header: 'Content', key: 'content', width: 56 },
    ],
    flat.ucConditions
  )

  addDataSheet(
    wb,
    DATA_SHEET.ucFlows,
    [
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'Flow No.', key: 'flowNo', width: 10 },
      { header: 'Flow Type', key: 'flowType', width: 14 },
      { header: 'Flow Name', key: 'flowName', width: 28 },
      { header: 'Condition Text', key: 'conditionText', width: 40 },
    ],
    flat.ucFlows
  )

  addDataSheet(
    wb,
    DATA_SHEET.ucSteps,
    [
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'Flow No.', key: 'flowNo', width: 10 },
      { header: 'Step No.', key: 'stepNo', width: 10 },
      { header: 'Step Type', key: 'stepType', width: 16 },
      { header: 'Content', key: 'content', width: 56 },
    ],
    flat.ucFlowSteps
  )

  addDataSheet(
    wb,
    DATA_SHEET.ucBr,
    [
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'Rule Code', key: 'ruleCode', width: 12 },
      { header: 'Description', key: 'description', width: 56 },
    ],
    flat.ucBusinessRules
  )

  addDataSheet(
    wb,
    DATA_SHEET.ucAc,
    [
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'AC No.', key: 'acNo', width: 8 },
      { header: 'Title', key: 'title', width: 28 },
      { header: 'Given', key: 'given', width: 28 },
      { header: 'When', key: 'when', width: 28 },
      { header: 'Then', key: 'then', width: 28 },
    ],
    flat.ucAcceptanceCriteria
  )

  addDataSheet(
    wb,
    DATA_SHEET.technical,
    [
      { header: 'Group', key: 'group', width: 18 },
      { header: 'Group ID', key: 'groupId', width: 36 },
      { header: 'Requirement Code', key: 'requirementCode', width: 14 },
      { header: 'Requirement ID', key: 'requirementId', width: 36 },
      { header: 'Function Code', key: 'functionCode', width: 14 },
      { header: 'Function ID', key: 'functionId', width: 36 },
      { header: 'Function Status', key: 'functionStatus', width: 14 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Module ID', key: 'moduleId', width: 36 },
      { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
      { header: 'Use Case ID', key: 'useCaseId', width: 36 },
      { header: 'Created', key: 'createdAt', width: 18 },
      { header: 'Updated', key: 'updatedAt', width: 18 },
      { header: 'Load Error', key: 'loadError', width: 20 },
      { header: 'Pack ID', key: 'packId', width: 36 },
      { header: 'Project ID', key: 'projectId', width: 36 },
      { header: 'Pack Note', key: 'packNote', width: 24 },
    ],
    flat.technical
  )
}

function setVisibleSheetOrder(wb: ExcelJS.Workbook): void {
  const order = [
    'Summary',
    BUSINESS_SHEET.requirementView,
    BUSINESS_SHEET.functionView,
    BUSINESS_SHEET.useCaseView,
    BUSINESS_SHEET.traceability,
    ...Object.values(DATA_SHEET),
  ]
  order.forEach((name, index) => {
    const sheet = wb.getWorksheet(name) as (ExcelJS.Worksheet & { orderNo?: number }) | undefined
    if (sheet) sheet.orderNo = index + 1
  })
}

export function suggestSpecPackExcelFilename(doc: SpecPackPreviewDocument): string {
  const safe = doc.title
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${safe || 'spec-pack'}-scope.xlsx`
}

/** Business views first; normalized data sheets hidden at the end. */
export async function buildSpecPackExcelWorkbook(
  doc: SpecPackPreviewDocument
): Promise<ExcelJS.Workbook> {
  const flat = flattenSpecPackForExcel(doc)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scopery'
  wb.created = new Date()

  // Build Function View before Requirement View so linked codes can hyperlink.
  const functionAnchors = addFunctionViewSheet(wb, flat)
  const requirementAnchors = addRequirementViewSheet(wb, flat, functionAnchors)
  const useCaseAnchors = addUseCaseViewSheet(wb, flat)
  addTraceabilitySheet(wb, flat, {
    requirements: requirementAnchors,
    functions: functionAnchors,
    useCases: useCaseAnchors,
  })
  addSummarySheet(wb, flat.summary)
  addNormalizedDataSheets(wb, flat)
  setVisibleSheetOrder(wb)

  return wb
}
