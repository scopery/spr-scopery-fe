import ExcelJS from 'exceljs'
import type { SpecPackExcelFlat } from './rows'

const FONT: Partial<ExcelJS.Font> = { name: 'Century Gothic', size: 10 }
const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 10,
  bold: true,
  color: { argb: 'FF1F2937' },
}
const BLOCK_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 12,
  bold: true,
  color: { argb: 'FF111827' },
}
const SECTION_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 10,
  bold: true,
  color: { argb: 'FF374151' },
}
const FIELD_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 10,
  bold: true,
  color: { argb: 'FF4B5563' },
}

const BLOCK_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE5E7EB' },
}
const SECTION_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
}
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF9FAFB' },
}
const LINK_FONT: Partial<ExcelJS.Font> = {
  name: 'Century Gothic',
  size: 10,
  color: { argb: 'FF1D4ED8' },
  underline: true,
}

export const BUSINESS_SHEET = {
  requirementView: 'Requirement View',
  functionView: 'Function View',
  useCaseView: 'Use Case View',
  traceability: 'Traceability',
} as const

export function codeTitle(code: string, title: string): string {
  const c = code.trim()
  const t = title.trim()
  if (c && t) return `${c} — ${t}`
  return c || t
}

type Writer = {
  sheet: ExcelJS.Worksheet
  row: number
}

function ensureWidths(sheet: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w
  })
}

function paintRow(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  values: Array<string | number | ExcelJS.CellValue>,
  opts?: {
    outlineLevel?: number
    font?: Partial<ExcelJS.Font>
    fill?: ExcelJS.Fill
    boldFirst?: boolean
  }
): ExcelJS.Row {
  const row = sheet.getRow(rowNumber)
  row.outlineLevel = opts?.outlineLevel ?? 0
  values.forEach((value, i) => {
    const cell = row.getCell(i + 1)
    cell.value = value
    cell.font = opts?.font ?? FONT
    cell.alignment = { vertical: 'top', wrapText: true }
    if (opts?.fill) cell.fill = opts.fill
    if (opts?.boldFirst && i === 0) cell.font = FIELD_FONT
  })
  return row
}

function writeBlank(w: Writer, outlineLevel = 0): void {
  const row = w.sheet.getRow(w.row)
  row.outlineLevel = outlineLevel
  w.row += 1
}

function writeBlockHeader(w: Writer, title: string): number {
  const start = w.row
  paintRow(w.sheet, w.row, [title], {
    outlineLevel: 0,
    font: BLOCK_FONT,
    fill: BLOCK_FILL,
  })
  w.row += 1
  return start
}

function writeSectionHeader(w: Writer, title: string): void {
  paintRow(w.sheet, w.row, [title], {
    outlineLevel: 1,
    font: SECTION_FONT,
    fill: SECTION_FILL,
  })
  w.row += 1
}

function writeField(w: Writer, field: string, value: string): void {
  paintRow(w.sheet, w.row, [field, value], {
    outlineLevel: 1,
    boldFirst: true,
  })
  w.row += 1
}

function writeTableHeader(w: Writer, headers: string[], outlineLevel = 1): void {
  paintRow(w.sheet, w.row, headers, {
    outlineLevel,
    font: HEADER_FONT,
    fill: HEADER_FILL,
  })
  w.row += 1
}

function writeTableRow(
  w: Writer,
  values: Array<string | number | ExcelJS.CellValue>,
  outlineLevel = 1
): ExcelJS.Row {
  const row = paintRow(w.sheet, w.row, values, { outlineLevel })
  w.row += 1
  return row
}

function prepViewSheet(sheet: ExcelJS.Worksheet, widths: number[]): void {
  ensureWidths(sheet, widths)
  sheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 1 }]
  sheet.properties.outlineLevelRow = 1
  // summaryBelow:false → collapse control sits on the parent (block header) row
  ;(sheet.properties as ExcelJS.Worksheet['properties'] & {
    outlineProperties?: { summaryBelow: boolean; summaryRight: boolean }
  }).outlineProperties = {
    summaryBelow: false,
    summaryRight: false,
  }
}

/** Map function code → first row of its Function View block. */
export function addFunctionViewSheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat
): Map<string, number> {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.functionView)
  prepViewSheet(sheet, [22, 56, 14, 14, 48])
  paintRow(sheet, 1, ['Function View — each function is a self-contained block'], {
    font: SECTION_FONT,
  })

  const anchorByFn = new Map<string, number>()
  const w: Writer = { sheet, row: 3 }

  for (const fn of flat.functions) {
    const anchor = writeBlockHeader(
      w,
      `FUNCTION · ${codeTitle(fn.functionCode, fn.title)}`
    )
    anchorByFn.set(fn.functionCode, anchor)

    writeSectionHeader(w, 'FUNCTION INFORMATION')
    writeField(w, 'Function', codeTitle(fn.functionCode, fn.title))
    writeField(w, 'Type', fn.type)
    writeField(w, 'Priority', fn.priority)
    writeField(w, 'Description', fn.description)

    const linkedReqs = flat.reqFnLinks.filter((l) => l.functionCode === fn.functionCode)
    writeSectionHeader(w, 'LINKED REQUIREMENTS')
    if (linkedReqs.length === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['Requirement', 'Requirement Title'])
      for (const link of linkedReqs) {
        writeTableRow(w, [link.requirementCode, link.requirementTitle])
      }
    }

    const acs = flat.fnAcceptanceCriteria.filter((r) => r.functionCode === fn.functionCode)
    writeSectionHeader(w, 'ACCEPTANCE CRITERIA')
    if (acs.length === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['No.', 'Acceptance Criterion'])
      for (const ac of acs) writeTableRow(w, [ac.acNo, ac.criterion])
    }

    const brs = flat.fnBusinessRules.filter((r) => r.functionCode === fn.functionCode)
    writeSectionHeader(w, 'BUSINESS RULES')
    if (brs.length === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['Rule', 'Rule Title', 'Severity', 'Description'])
      for (const br of brs) {
        writeTableRow(w, [br.ruleCode, br.ruleTitle, br.severity, br.description])
      }
    }

    writeBlank(w, 0)
  }

  return anchorByFn
}

/** Map requirement code → first row of its Requirement View block. */
export function addRequirementViewSheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat,
  functionAnchors: Map<string, number>
): Map<string, number> {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.requirementView)
  prepViewSheet(sheet, [22, 42, 14, 14, 48])
  paintRow(sheet, 1, ['Requirement View — linked functions shown below each requirement'], {
    font: SECTION_FONT,
  })

  const fnByCode = new Map(flat.functions.map((f) => [f.functionCode, f]))
  const anchorByReq = new Map<string, number>()
  const w: Writer = { sheet, row: 3 }

  for (const req of flat.requirements) {
    const anchor = writeBlockHeader(w, `REQUIREMENT · ${codeTitle(req.code, req.title)}`)
    anchorByReq.set(req.code, anchor)

    writeSectionHeader(w, 'REQUIREMENT INFORMATION')
    writeField(w, 'Requirement', codeTitle(req.code, req.title))
    writeField(w, 'Group', req.group)
    writeField(w, 'Requirement Type', req.requirementType)
    writeField(w, 'Priority', req.priority)
    writeField(w, 'Description', req.description)

    const linked = flat.reqFnLinks.filter((l) => l.requirementCode === req.code)
    writeSectionHeader(w, 'LINKED FUNCTIONS')
    if (linked.length === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['Function', 'Function Title', 'Priority', 'Type'])
      for (const link of linked) {
        const fn = fnByCode.get(link.functionCode)
        const row = writeTableRow(w, [
          link.functionCode,
          link.functionTitle,
          fn?.priority ?? '',
          fn?.type ?? '',
        ])
        const target = functionAnchors.get(link.functionCode)
        if (target) {
          const cell = row.getCell(1)
          cell.value = {
            text: link.functionCode,
            hyperlink: `#'${BUSINESS_SHEET.functionView}'!A${target}`,
          }
          cell.font = LINK_FONT
        }
      }
    }

    writeBlank(w, 0)
  }

  return anchorByReq
}

export function addUseCaseViewSheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat
): Map<string, number> {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.useCaseView)
  prepViewSheet(sheet, [22, 42, 16, 48, 36])
  paintRow(sheet, 1, ['Use Case View — full use case detail in one block'], {
    font: SECTION_FONT,
  })

  const anchorByUc = new Map<string, number>()
  const w: Writer = { sheet, row: 3 }

  for (const uc of flat.useCases) {
    const parentLinks = flat.fnUcLinks.filter((l) => l.useCaseKey === uc.useCaseKey)
    const parentLabel = parentLinks
      .map((l) => codeTitle(l.functionCode, l.functionTitle))
      .join('\n')

    const anchor = writeBlockHeader(w, `USE CASE · ${codeTitle(uc.useCaseKey, uc.name)}`)
    anchorByUc.set(uc.useCaseKey, anchor)

    writeSectionHeader(w, 'USE CASE INFORMATION')
    writeField(w, 'Use Case', codeTitle(uc.useCaseKey, uc.name))
    writeField(w, 'Parent Function', parentLabel || '(none)')
    writeField(w, 'Goal', uc.goal)
    writeField(w, 'Primary Actor', uc.primaryActor)
    writeField(w, 'Trigger', uc.trigger)

    writeSectionHeader(
      w,
      'RELATED REQUIREMENTS (through parent function — not owned by the use case)'
    )
    const relatedReqs = new Map<string, string>()
    for (const pl of parentLinks) {
      for (const link of flat.reqFnLinks) {
        if (link.functionCode !== pl.functionCode) continue
        relatedReqs.set(link.requirementCode, link.requirementTitle)
      }
    }
    if (relatedReqs.size === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['Requirement', 'Requirement Title'])
      for (const [code, title] of relatedReqs) writeTableRow(w, [code, title])
    }

    const conditions = flat.ucConditions.filter((c) => c.useCaseKey === uc.useCaseKey)
    writeSectionHeader(w, 'CONDITIONS')
    if (conditions.length === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['Type', 'Content'])
      for (const c of conditions) writeTableRow(w, [c.conditionType, c.content])
    }

    const flows = flat.ucFlows.filter((f) => f.useCaseKey === uc.useCaseKey)
    if (flows.length === 0) {
      writeSectionHeader(w, 'FLOWS')
      writeTableRow(w, ['(none)'])
    } else {
      for (const flow of flows) {
        const flowTitle =
          flow.flowType === 'MAIN'
            ? 'MAIN FLOW'
            : `${flow.flowType} FLOW${flow.flowName ? ` — ${flow.flowName}` : ''}`
        writeSectionHeader(w, flowTitle)
        if (flow.conditionText) writeField(w, 'Condition Text', flow.conditionText)
        const steps = flat.ucFlowSteps.filter(
          (s) => s.useCaseKey === uc.useCaseKey && s.flowNo === flow.flowNo
        )
        if (steps.length === 0) {
          writeTableRow(w, ['(no steps)'], 2)
        } else {
          writeTableHeader(w, ['Step', 'Step Type', 'Content'], 2)
          for (const step of steps) {
            writeTableRow(w, [step.stepNo, step.stepType, step.content], 2)
          }
        }
      }
    }

    const brs = flat.ucBusinessRules.filter((r) => r.useCaseKey === uc.useCaseKey)
    writeSectionHeader(w, 'USE CASE BUSINESS RULES')
    if (brs.length === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['Rule Code', 'Description'])
      for (const br of brs) writeTableRow(w, [br.ruleCode, br.description])
    }

    const acs = flat.ucAcceptanceCriteria.filter((r) => r.useCaseKey === uc.useCaseKey)
    writeSectionHeader(w, 'USE CASE ACCEPTANCE CRITERIA')
    if (acs.length === 0) {
      writeTableRow(w, ['(none)'])
    } else {
      writeTableHeader(w, ['Title', 'Given', 'When', 'Then'])
      for (const ac of acs) writeTableRow(w, [ac.title, ac.given, ac.when, ac.then])
    }

    writeBlank(w, 0)
  }

  return anchorByUc
}

export function addTraceabilitySheet(
  wb: ExcelJS.Workbook,
  flat: SpecPackExcelFlat,
  anchors: {
    requirements: Map<string, number>
    functions: Map<string, number>
    useCases: Map<string, number>
  }
): void {
  const sheet = wb.addWorksheet(BUSINESS_SHEET.traceability)
  ensureWidths(sheet, [16, 36, 14, 36, 16, 32])
  sheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 1 }]

  const headers = [
    'Requirement',
    'Requirement Title',
    'Function',
    'Function Title',
    'Use Case',
    'Use Case Name',
  ]
  paintRow(sheet, 1, headers, { font: HEADER_FONT, fill: HEADER_FILL })
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 6 },
  }

  let rowNum = 2
  for (const link of flat.reqFnLinks) {
    const ucLinks = flat.fnUcLinks.filter((u) => u.functionCode === link.functionCode)
    const rows =
      ucLinks.length > 0
        ? ucLinks.map((u) => ({
            ucKey: u.useCaseKey,
            ucName: u.useCaseName,
          }))
        : [{ ucKey: '', ucName: '' }]

    for (const uc of rows) {
      const row = sheet.getRow(rowNum)
      row.font = FONT
      row.alignment = { vertical: 'top', wrapText: true }

      const reqCell = row.getCell(1)
      const reqAnchor = anchors.requirements.get(link.requirementCode)
      if (reqAnchor) {
        reqCell.value = {
          text: link.requirementCode,
          hyperlink: `#'${BUSINESS_SHEET.requirementView}'!A${reqAnchor}`,
        }
        reqCell.font = LINK_FONT
      } else {
        reqCell.value = link.requirementCode
      }
      row.getCell(2).value = link.requirementTitle

      const fnCell = row.getCell(3)
      const fnAnchor = anchors.functions.get(link.functionCode)
      if (fnAnchor) {
        fnCell.value = {
          text: link.functionCode,
          hyperlink: `#'${BUSINESS_SHEET.functionView}'!A${fnAnchor}`,
        }
        fnCell.font = LINK_FONT
      } else {
        fnCell.value = link.functionCode
      }
      row.getCell(4).value = link.functionTitle

      const ucCell = row.getCell(5)
      const ucAnchor = uc.ucKey ? anchors.useCases.get(uc.ucKey) : undefined
      if (uc.ucKey && ucAnchor) {
        ucCell.value = {
          text: uc.ucKey,
          hyperlink: `#'${BUSINESS_SHEET.useCaseView}'!A${ucAnchor}`,
        }
        ucCell.font = LINK_FONT
      } else {
        ucCell.value = uc.ucKey
      }
      row.getCell(6).value = uc.ucName

      rowNum += 1
    }
  }
}
