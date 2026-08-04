import ExcelJS from 'exceljs'
import type { SpecPackExcelFlat } from './rows'

const FONT: Partial<ExcelJS.Font> = { name: 'Century Gothic', size: 10 }
const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 10,
  bold: true,
  color: { argb: 'FF1F2937' },
}
const LINK_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 10,
  color: { argb: 'FF1D4ED8' },
  underline: true,
}
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE5E7EB' },
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

export const BUSINESS_SHEET = {
  summary: 'Summary',
  requirements: 'Requirements',
  functions: 'Functions',
  useCases: 'Use Cases',
  traceability: 'Traceability',
} as const

export function codeTitle(code: string, title: string): string {
  const c = code.trim()
  const t = title.trim()
  if (c && t) return `${c} — ${t}`
  return c || t
}

export type SheetAnchors = {
  requirements: Map<string, number>
  functions: Map<string, number>
  useCases: Map<string, number>
}

function styleHeader(sheet: ExcelJS.Worksheet, columnCount: number): void {
  const row = sheet.getRow(1)
  row.height = 22
  row.font = HEADER_FONT
  for (let c = 1; c <= columnCount; c++) {
    const cell = row.getCell(c)
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    }
  }
}

function configureListSheet(
  sheet: ExcelJS.Worksheet,
  columnCount: number,
  freezeCols = 2
): void {
  styleHeader(sheet, columnCount)
  sheet.views = [
    {
      state: 'frozen',
      xSplit: freezeCols,
      ySplit: 1,
      showGridLines: false,
      activeCell: 'A2',
    },
  ]
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columnCount },
  }
}

function applyBody(sheet: ExcelJS.Worksheet): void {
  sheet.eachRow((row, n) => {
    if (n === 1) return
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

function paintGroupAndPriority(
  sheet: ExcelJS.Worksheet,
  rows: Array<{ group?: string; priority?: string }>,
  groupCol: number | null,
  priorityCol: number | null
): void {
  const cache = new Map<string, number>()
  rows.forEach((r, i) => {
    const excelRow = i + 2
    if (groupCol != null && r.group) {
      const fill = GROUP_FILLS[groupFillIndex(r.group, cache)]!
      sheet.getRow(excelRow).getCell(groupCol).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fill },
      }
    }
    if (priorityCol != null && r.priority) {
      const fill = priorityFillArgb(r.priority)
      if (fill) {
        sheet.getRow(excelRow).getCell(priorityCol).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fill },
        }
      }
    }
  })
}

function setHyperlink(
  cell: ExcelJS.Cell,
  text: string,
  sheetName: string,
  row: number,
  colLetter = 'A'
): void {
  if (!text || row < 2) {
    cell.value = text
    return
  }
  cell.value = {
    text,
    hyperlink: `#'${sheetName}'!${colLetter}${row}`,
  }
  cell.font = LINK_FONT
}

function formatFnAc(flat: SpecPackExcelFlat, functionCode: string): string {
  return flat.fnAcceptanceCriteria
    .filter((r) => r.functionCode === functionCode)
    .map((r) => `${r.acNo}. ${r.criterion}`)
    .join('\n')
}

function formatFnBr(flat: SpecPackExcelFlat, functionCode: string): string {
  return flat.fnBusinessRules
    .filter((r) => r.functionCode === functionCode)
    .map((r) => {
      const head = [r.ruleCode, r.severity].filter(Boolean).join(' | ')
      return [head, r.ruleTitle, r.description].filter(Boolean).join('\n')
    })
    .join('\n\n')
}

function formatUcConditions(flat: SpecPackExcelFlat, useCaseKey: string): string {
  return flat.ucConditions
    .filter((c) => c.useCaseKey === useCaseKey)
    .map((c) => `${c.conditionType} — ${c.content}`)
    .join('\n')
}

function formatUcFlows(flat: SpecPackExcelFlat, useCaseKey: string): string {
  const flows = flat.ucFlows.filter((f) => f.useCaseKey === useCaseKey)
  return flows
    .map((flow) => {
      const title = [flow.flowType, flow.flowName].filter(Boolean).join(' — ')
      const lines = [title]
      if (flow.conditionText) lines.push(`Condition: ${flow.conditionText}`)
      const steps = flat.ucFlowSteps.filter(
        (s) => s.useCaseKey === useCaseKey && s.flowNo === flow.flowNo
      )
      for (const step of steps) {
        lines.push(`${step.stepNo}. [${step.stepType}] ${step.content}`)
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

function formatUcBr(flat: SpecPackExcelFlat, useCaseKey: string): string {
  return flat.ucBusinessRules
    .filter((r) => r.useCaseKey === useCaseKey)
    .map((r) => `${r.ruleCode}\n${r.description}`)
    .join('\n\n')
}

function formatUcAc(flat: SpecPackExcelFlat, useCaseKey: string): string {
  return flat.ucAcceptanceCriteria
    .filter((r) => r.useCaseKey === useCaseKey)
    .map((r) => {
      const lines = [r.title]
      if (r.given) lines.push(`GIVEN ${r.given}`)
      if (r.when) lines.push(`WHEN ${r.when}`)
      if (r.then) lines.push(`THEN ${r.then}`)
      return lines.join('\n')
    })
    .join('\n\n')
}

/** Build Functions sheet first so Requirements can hyperlink into it. */
export function addFunctionsListSheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat
): Map<string, number> {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.functions)
  const headers = [
    'Function Code',
    'Function Title',
    'Description',
    'Type',
    'Priority',
    'Linked Requirements',
    'Acceptance Criteria',
    'Business Rules',
  ]
  sheet.columns = [
    { header: headers[0], key: 'functionCode', width: 14 },
    { header: headers[1], key: 'title', width: 32 },
    { header: headers[2], key: 'description', width: 48 },
    { header: headers[3], key: 'type', width: 14 },
    { header: headers[4], key: 'priority', width: 12 },
    { header: headers[5], key: 'linkedRequirements', width: 40 },
    { header: headers[6], key: 'acceptanceCriteria', width: 44 },
    { header: headers[7], key: 'businessRules', width: 40 },
  ]

  const anchors = new Map<string, number>()
  flat.functions.forEach((fn, i) => {
    const excelRow = i + 2
    anchors.set(fn.functionCode, excelRow)
    const linked = flat.reqFnLinks
      .filter((l) => l.functionCode === fn.functionCode)
      .map((l) => codeTitle(l.requirementCode, l.requirementTitle))
      .join('\n')
    sheet.addRow({
      functionCode: fn.functionCode,
      title: fn.title,
      description: fn.description,
      type: fn.type,
      priority: fn.priority,
      linkedRequirements: linked,
      acceptanceCriteria: formatFnAc(flat, fn.functionCode),
      businessRules: formatFnBr(flat, fn.functionCode),
    })
  })

  configureListSheet(sheet, headers.length, 1)
  applyBody(sheet)
  paintGroupAndPriority(
    sheet,
    flat.functions.map((f) => ({ priority: f.priority })),
    null,
    5
  )
  return anchors
}

export function addRequirementsListSheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat,
  functionAnchors: Map<string, number>
): Map<string, number> {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.requirements)
  const maxLinks = Math.max(
    1,
    ...flat.requirements.map(
      (req) =>
        flat.reqFnLinks.filter((l) => l.requirementCode === req.code).length
    )
  )

  const baseHeaders = [
    'Group',
    'Requirement Code',
    'Requirement Title',
    'Description',
    'Requirement Type',
    'Priority',
  ]
  const linkHeaders = Array.from(
    { length: maxLinks },
    (_, i) => `Linked Function ${i + 1}`
  )
  const headers = [...baseHeaders, ...linkHeaders]

  sheet.columns = [
    { header: 'Group', key: 'group', width: 18 },
    { header: 'Requirement Code', key: 'code', width: 14 },
    { header: 'Requirement Title', key: 'title', width: 32 },
    { header: 'Description', key: 'description', width: 48 },
    { header: 'Requirement Type', key: 'requirementType', width: 16 },
    { header: 'Priority', key: 'priority', width: 12 },
    ...linkHeaders.map((h, i) => ({
      header: h,
      key: `linkedFn${i + 1}`,
      width: 36,
    })),
  ]

  const anchors = new Map<string, number>()
  flat.requirements.forEach((req, i) => {
    const excelRow = i + 2
    anchors.set(req.code, excelRow)
    const links = flat.reqFnLinks.filter((l) => l.requirementCode === req.code)
    const row: Record<string, string> = {
      group: req.group,
      code: req.code,
      title: req.title,
      description: req.description,
      requirementType: req.requirementType,
      priority: req.priority,
    }
    for (let n = 0; n < maxLinks; n++) {
      const link = links[n]
      row[`linkedFn${n + 1}`] = link
        ? codeTitle(link.functionCode, link.functionTitle)
        : ''
    }
    sheet.addRow(row)

    links.forEach((link, n) => {
      const cell = sheet.getRow(excelRow).getCell(baseHeaders.length + n + 1)
      const target = functionAnchors.get(link.functionCode)
      if (target) {
        setHyperlink(
          cell,
          codeTitle(link.functionCode, link.functionTitle),
          BUSINESS_SHEET.functions,
          target
        )
      }
    })
  })

  configureListSheet(sheet, headers.length, 2)
  applyBody(sheet)
  paintGroupAndPriority(
    sheet,
    flat.requirements.map((r) => ({ group: r.group, priority: r.priority })),
    1,
    6
  )
  return anchors
}

export function addUseCasesListSheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat,
  functionAnchors: Map<string, number>
): Map<string, number> {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.useCases)
  const headers = [
    'Use Case Key',
    'Use Case Name',
    'Parent Function',
    'Goal',
    'Primary Actor',
    'Trigger',
    'Conditions',
    'Flows and Steps',
    'Business Rules',
    'Acceptance Criteria',
  ]
  sheet.columns = [
    { header: headers[0], key: 'useCaseKey', width: 16 },
    { header: headers[1], key: 'name', width: 28 },
    { header: headers[2], key: 'parentFunction', width: 40 },
    { header: headers[3], key: 'goal', width: 32 },
    { header: headers[4], key: 'primaryActor', width: 16 },
    { header: headers[5], key: 'trigger', width: 28 },
    { header: headers[6], key: 'conditions', width: 36 },
    { header: headers[7], key: 'flows', width: 44 },
    { header: headers[8], key: 'businessRules', width: 32 },
    { header: headers[9], key: 'acceptanceCriteria', width: 40 },
  ]

  const anchors = new Map<string, number>()
  flat.useCases.forEach((uc, i) => {
    const excelRow = i + 2
    anchors.set(uc.useCaseKey, excelRow)
    const parents = flat.fnUcLinks.filter((l) => l.useCaseKey === uc.useCaseKey)
    const primary = parents[0]
    const parentLabel = primary
      ? codeTitle(primary.functionCode, primary.functionTitle)
      : parents
          .map((p) => codeTitle(p.functionCode, p.functionTitle))
          .join('\n')

    sheet.addRow({
      useCaseKey: uc.useCaseKey,
      name: uc.name,
      parentFunction: parentLabel,
      goal: uc.goal,
      primaryActor: uc.primaryActor,
      trigger: uc.trigger,
      conditions: formatUcConditions(flat, uc.useCaseKey),
      flows: formatUcFlows(flat, uc.useCaseKey),
      businessRules: formatUcBr(flat, uc.useCaseKey),
      acceptanceCriteria: formatUcAc(flat, uc.useCaseKey),
    })

    if (primary) {
      const target = functionAnchors.get(primary.functionCode)
      if (target) {
        setHyperlink(
          sheet.getRow(excelRow).getCell(3),
          parentLabel,
          BUSINESS_SHEET.functions,
          target
        )
      }
    }
  })

  configureListSheet(sheet, headers.length, 1)
  applyBody(sheet)
  return anchors
}

export function addTraceabilityListSheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat,
  anchors: SheetAnchors
): void {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.traceability)
  sheet.columns = [
    { header: 'Requirement Code', key: 'requirementCode', width: 14 },
    { header: 'Requirement Title', key: 'requirementTitle', width: 32 },
    { header: 'Function Code', key: 'functionCode', width: 14 },
    { header: 'Function Title', key: 'functionTitle', width: 32 },
    { header: 'Use Case Key', key: 'useCaseKey', width: 16 },
    { header: 'Use Case Name', key: 'useCaseName', width: 28 },
  ]

  let rowNum = 2
  for (const link of flat.reqFnLinks) {
    const ucLinks = flat.fnUcLinks.filter((u) => u.functionCode === link.functionCode)
    const paths =
      ucLinks.length > 0
        ? ucLinks
        : [{ useCaseKey: '', useCaseName: '', functionCode: '', functionTitle: '' }]

    for (const uc of paths) {
      sheet.addRow({
        requirementCode: link.requirementCode,
        requirementTitle: link.requirementTitle,
        functionCode: link.functionCode,
        functionTitle: link.functionTitle,
        useCaseKey: uc.useCaseKey,
        useCaseName: uc.useCaseName,
      })
      const row = sheet.getRow(rowNum)
      const reqAnchor = anchors.requirements.get(link.requirementCode)
      if (reqAnchor) {
        setHyperlink(
          row.getCell(1),
          link.requirementCode,
          BUSINESS_SHEET.requirements,
          reqAnchor,
          'B'
        )
      }
      const fnAnchor = anchors.functions.get(link.functionCode)
      if (fnAnchor) {
        setHyperlink(
          row.getCell(3),
          link.functionCode,
          BUSINESS_SHEET.functions,
          fnAnchor
        )
      }
      if (uc.useCaseKey) {
        const ucAnchor = anchors.useCases.get(uc.useCaseKey)
        if (ucAnchor) {
          setHyperlink(
            row.getCell(5),
            uc.useCaseKey,
            BUSINESS_SHEET.useCases,
            ucAnchor
          )
        }
      }
      rowNum += 1
    }
  }

  configureListSheet(sheet, 6, 1)
  applyBody(sheet)
}
