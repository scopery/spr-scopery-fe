import ExcelJS from 'exceljs'
import {
  SCREEN_SPEC_EXCEL_SHEETS,
  buildScreenSpecWorkbookModel,
  defineModeColumnLabel,
  suggestScreenSpecExcelFilename,
  type ScreenSpecExcelHeader,
  type ScreenSpecExcelOutlineRow,
  type ScreenSpecWorkbookModel,
} from '../../domain/rules/screen-spec-excel.rules'
import type { ScreenSpecDocFullSpec } from '../../domain/model/screen-spec-doc'

const FONT_NAME = 'Century Gothic'
const FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 11, color: { argb: 'FF000000' } }
const BOLD: Partial<ExcelJS.Font> = { ...FONT, bold: true }
const WHITE_BOLD: Partial<ExcelJS.Font> = {
  name: FONT_NAME,
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
}
const NOTE_FONT: Partial<ExcelJS.Font> = { ...FONT, italic: true, color: { argb: 'FF595959' } }

const NAVY_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
const LABEL_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
const PROCESS_BAR_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
const SECTION_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }
const GROUP_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }
const FIELD_BANNER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
const WHITE_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }

const BLACK: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
}

const MIN_ROW_HEIGHT = 20
const HEADER_LAST_COL = 6
const EMPTY_HISTORY_ROWS = 8
const VALIDATION_NOTE =
  'Note: Required and Max Length are specified on the Defines sheet. List only additional business validation rules here.'

function paint(
  cell: ExcelJS.Cell,
  fill?: ExcelJS.Fill,
  font: Partial<ExcelJS.Font> = FONT,
  alignment?: Partial<ExcelJS.Alignment>
) {
  cell.font = font
  cell.border = BLACK
  cell.alignment = {
    vertical: alignment?.vertical ?? 'middle',
    horizontal: alignment?.horizontal ?? 'left',
    wrapText: true,
  }
  if (fill) cell.fill = fill
}

function ensureRowHeight(row: ExcelJS.Row, min = MIN_ROW_HEIGHT) {
  if (!row.height || row.height < min) row.height = min
}

function paintRange(
  sheet: ExcelJS.Worksheet,
  row: number,
  from: number,
  to: number,
  fill?: ExcelJS.Fill,
  font: Partial<ExcelJS.Font> = FONT,
  alignment?: Partial<ExcelJS.Alignment>
) {
  for (let c = from; c <= to; c++) paint(sheet.getCell(row, c), fill, font, alignment)
}

function writeLabelValuePair(
  sheet: ExcelJS.Worksheet,
  row: number,
  labelCol: number,
  valueCol: number,
  label: string,
  value: string
) {
  const labelCell = sheet.getCell(row, labelCol)
  labelCell.value = label
  paint(labelCell, LABEL_FILL, BOLD)
  const valueCell = sheet.getCell(row, valueCol)
  valueCell.value = value
  paint(valueCell, WHITE_FILL)
}

function writeMeta(sheet: ExcelJS.Worksheet, header: ScreenSpecExcelHeader): number {
  sheet.mergeCells(2, 1, 6, 2)
  const common = sheet.getCell(2, 1)
  common.value = 'Common Information'
  paint(common, NAVY_FILL, WHITE_BOLD, { vertical: 'top' })
  paintRange(sheet, 2, 2, 2, NAVY_FILL, WHITE_BOLD, { vertical: 'top' })
  for (let r = 3; r <= 6; r++) {
    paintRange(sheet, r, 1, 2, NAVY_FILL, WHITE_BOLD, { vertical: 'top' })
    ensureRowHeight(sheet.getRow(r))
  }
  ensureRowHeight(sheet.getRow(2))

  const commonLeft: Array<[number, string, string]> = [
    [2, 'Project Name', header.projectName],
    [3, 'System Name', header.systemName],
    [4, 'Phase', header.phaseName],
    [5, 'Document ID', header.documentCode],
    [6, 'Document Name', header.documentName],
  ]
  const commonRight: Array<[number, string, string]> = [
    [2, 'Author', ''],
    [3, 'Created Date', ''],
    [4, 'Version', ''],
    [5, 'Updated By', ''],
    [6, 'Updated Date', ''],
  ]
  for (const [r, label, value] of commonLeft) writeLabelValuePair(sheet, r, 3, 4, label, value)
  for (const [r, label, value] of commonRight) writeLabelValuePair(sheet, r, 5, 6, label, value)

  sheet.mergeCells(7, 1, 9, 2)
  const screenInfo = sheet.getCell(7, 1)
  screenInfo.value = 'Screen Information'
  paint(screenInfo, NAVY_FILL, WHITE_BOLD, { vertical: 'top' })
  paintRange(sheet, 7, 2, 2, NAVY_FILL, WHITE_BOLD, { vertical: 'top' })
  for (let r = 8; r <= 9; r++) paintRange(sheet, r, 1, 2, NAVY_FILL, WHITE_BOLD, { vertical: 'top' })

  writeLabelValuePair(sheet, 7, 3, 4, 'Screen ID', header.screenIdText)
  writeLabelValuePair(sheet, 8, 3, 4, 'Screen Name', header.screenNameText)
  writeLabelValuePair(sheet, 9, 3, 4, 'Overview', header.overview)
  sheet.mergeCells(9, 4, 9, 6)
  paint(sheet.getCell(9, 4), WHITE_FILL)
  paintRange(sheet, 9, 5, 6, WHITE_FILL)
  paintRange(sheet, 7, 5, 6, WHITE_FILL)
  paintRange(sheet, 8, 5, 6, WHITE_FILL)
  ensureRowHeight(sheet.getRow(7))
  ensureRowHeight(sheet.getRow(8))
  ensureRowHeight(sheet.getRow(9), header.overview ? 36 : MIN_ROW_HEIGHT)

  sheet.views = [{ state: 'frozen', ySplit: 10, showGridLines: false }]
  return 11
}

function writeNavyHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, headers: string[]) {
  headers.forEach((h, i) => {
    const cell = sheet.getCell(rowNumber, i + 1)
    cell.value = h
    paint(cell, NAVY_FILL, WHITE_BOLD, { horizontal: 'center' })
  })
  ensureRowHeight(sheet.getRow(rowNumber))
}

function writeBanner(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  lastCol: number,
  text: string,
  fill: ExcelJS.Fill,
  font: Partial<ExcelJS.Font>
) {
  sheet.mergeCells(rowNumber, 1, rowNumber, lastCol)
  const cell = sheet.getCell(rowNumber, 1)
  cell.value = text
  paint(cell, fill, font)
  paintRange(sheet, rowNumber, 2, lastCol, fill, font)
  ensureRowHeight(sheet.getRow(rowNumber))
}

function writeBodyCells(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  values: Array<string | number>,
  fill?: ExcelJS.Fill,
  font: Partial<ExcelJS.Font> = FONT
) {
  values.forEach((v, i) => {
    const cell = sheet.getCell(rowNumber, i + 1)
    cell.value = v
    paint(cell, fill ?? WHITE_FILL, font, { horizontal: i === 0 && values.length > 4 ? 'center' : 'left' })
  })
  ensureRowHeight(sheet.getRow(rowNumber))
}

function numberedHeading(label: string, index: number): string {
  if (/^\d+\.\s/.test(label.trim())) return label.trim()
  return `${index}. ${label.trim()}`
}

function outlineValue(row: ScreenSpecExcelOutlineRow): string {
  return row.detail || row.source || row.condition || row.extra
}

function writeOutlineBlocks(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  rows: ScreenSpecExcelOutlineRow[],
  lastCol: number,
  headingFill: ExcelJS.Fill,
  headingFont: Partial<ExcelJS.Font>
): void {
  let r = startRow
  let headingIndex = 0
  rows.forEach((row, i) => {
    if (row.kind === 'screen') {
      writeBanner(sheet, r, lastCol, row.label, GROUP_FILL, BOLD)
      r += 1
      return
    }
    if (row.kind === 'heading') {
      headingIndex += 1
      writeBanner(sheet, r, lastCol, numberedHeading(row.label, headingIndex), headingFill, headingFont)
      r += 1
      return
    }
    const labelCell = sheet.getCell(r, 1)
    labelCell.value = row.label
    paint(labelCell, LABEL_FILL, BOLD)
    sheet.mergeCells(r, 2, r, lastCol)
    const valueCell = sheet.getCell(r, 2)
    valueCell.value = outlineValue(row)
    paint(valueCell, WHITE_FILL)
    paintRange(sheet, r, 3, lastCol, WHITE_FILL)
    ensureRowHeight(sheet.getRow(r), outlineValue(row).includes('\n') ? 36 : MIN_ROW_HEIGHT)
    r += 1
    const next = rows[i + 1]
    if (!next || next.kind !== 'detail') {
      r += 1
    }
  })
}

function applySheetColumns(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.columns = widths.map((width) => ({ width }))
}

function addChangeHistory(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.changeHistory)
  const start = writeMeta(sheet, model.header)
  const headers = ['Date', 'Rev.No', 'Target Sheet', 'Change Description', 'Owner', 'Color']
  writeNavyHeaderRow(sheet, start, headers)
  const bodyCount = Math.max(model.revisions.length, EMPTY_HISTORY_ROWS)
  for (let i = 0; i < bodyCount; i++) {
    const r = start + 1 + i
    const rev = model.revisions[i]
    writeBodyCells(
      sheet,
      r,
      rev
        ? [rev.changedAt, rev.revisionNo, rev.targetSheetName, rev.details, rev.personInCharge, rev.color]
        : ['', '', '', '', '', '']
    )
    const hex = rev?.color?.trim().replace(/^#/, '') ?? ''
    if (/^[0-9A-Fa-f]{6}$/.test(hex) || /^[0-9A-Fa-f]{3}$/.test(hex)) {
      const argb = hex.length === 3 ? `FF${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : `FF${hex.toUpperCase()}`
      paint(sheet.getCell(r, 6), { type: 'pattern', pattern: 'solid', fgColor: { argb } })
    }
  }
  applySheetColumns(sheet, [16, 12, 18, 48, 18, 14])
}

function addLayout(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.layout)
  const start = writeMeta(sheet, model.header)
  writeBanner(sheet, start, HEADER_LAST_COL, 'Figma / UI Reference', NAVY_FILL, WHITE_BOLD)
  sheet.mergeCells(start + 1, 1, start + 1, HEADER_LAST_COL)
  const url = sheet.getCell(start + 1, 1)
  url.value = model.header.figmaUrl
  paint(url, WHITE_FILL)
  paintRange(sheet, start + 1, 2, HEADER_LAST_COL, WHITE_FILL)
  ensureRowHeight(sheet.getRow(start + 1))

  const tableRow = start + 3
  const headers = ['Screen code', 'Screen name', 'Route', 'Modes', 'Notes']
  writeNavyHeaderRow(sheet, tableRow, headers)
  model.layoutScreens.forEach((row, i) => {
    writeBodyCells(sheet, tableRow + 1 + i, [row.code, row.name, row.routePath, row.modes, row.note])
  })
  applySheetColumns(sheet, [18, 32, 28, 28, 28, 18])
}

function addDefines(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.defines)
  const start = writeMeta(sheet, model.header)
  const modeHeaders = model.modeCodes.map(defineModeColumnLabel)
  const headers = [
    'No',
    'Field',
    'Physical name',
    'Type',
    'Required',
    'Length',
    ...modeHeaders,
    'Default',
    'Table / Source',
    'Column / Attribute',
    'Remark',
  ]
  writeBanner(sheet, start, headers.length, 'Field Data', FIELD_BANNER_FILL, WHITE_BOLD)
  writeNavyHeaderRow(sheet, start + 1, headers)

  model.defineRows.forEach((row, i) => {
    const r = start + 2 + i
    const values: Array<string | number> = [
      row.no,
      row.field,
      row.physicalName,
      row.type,
      row.required,
      row.length,
      ...model.modeCodes.map((code) => row.modeMarks[code] ?? ''),
      row.defaultValue,
      row.table,
      row.columnAttribute,
      row.remark,
    ]
    const fill = row.kind === 'screen' ? GROUP_FILL : row.kind === 'section' ? SECTION_FILL : WHITE_FILL
    const font = row.kind === 'field' ? FONT : BOLD
    writeBodyCells(sheet, r, values, fill, font)
    if (row.kind !== 'field') {
      sheet.mergeCells(r, 2, r, headers.length)
      paint(sheet.getCell(r, 2), fill, BOLD)
      paintRange(sheet, r, 3, headers.length, fill, BOLD)
    }
  })

  applySheetColumns(sheet, [
    8,
    28,
    20,
    14,
    12,
    10,
    ...model.modeCodes.map(() => 12),
    16,
    18,
    20,
    24,
  ])
}

function addProcesses(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.processes)
  const start = writeMeta(sheet, model.header)
  writeOutlineBlocks(sheet, start, model.processRows, HEADER_LAST_COL, PROCESS_BAR_FILL, BOLD)
  applySheetColumns(sheet, [18, 22, 18, 28, 16, 18])
}

function addEvents(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.event)
  const start = writeMeta(sheet, model.header)
  writeOutlineBlocks(sheet, start, model.eventRows, HEADER_LAST_COL, NAVY_FILL, WHITE_BOLD)
  applySheetColumns(sheet, [18, 22, 18, 28, 16, 18])
}

function addValidation(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.validation)
  const start = writeMeta(sheet, model.header)
  sheet.mergeCells(start, 1, start, 8)
  const note = sheet.getCell(start, 1)
  note.value = VALIDATION_NOTE
  paint(note, WHITE_FILL, NOTE_FONT)
  paintRange(sheet, start, 2, 8, WHITE_FILL, NOTE_FONT)
  ensureRowHeight(sheet.getRow(start), 32)

  const headers = [
    'No',
    'Field',
    'Physical name',
    'Validation Rule',
    'Param',
    'Individual rule',
    'Individual message',
    'Remark',
  ]
  writeNavyHeaderRow(sheet, start + 1, headers)
  model.validationRows.forEach((row, i) => {
    writeBodyCells(sheet, start + 2 + i, [
      String(i + 1),
      row.field,
      row.physicalName,
      row.ruleType,
      row.params,
      row.individualRule,
      row.errorMessage,
      row.remark,
    ])
  })
  applySheetColumns(sheet, [8, 24, 20, 18, 22, 24, 36, 20])
}

function addDatabase(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.database)
  const start = writeMeta(sheet, model.header)
  const headers = ['No', 'Data Source', 'Purpose / Attributes Used', 'Notes']
  writeNavyHeaderRow(sheet, start, headers)
  model.databaseRows.forEach((row, i) => {
    writeBodyCells(sheet, start + 1 + i, [String(i + 1), row.name, row.attributes, row.notes])
  })
  applySheetColumns(sheet, [8, 28, 48, 28, 16, 18])
}

export async function buildScreenSpecExcelWorkbook(doc: ScreenSpecDocFullSpec): Promise<ExcelJS.Workbook> {
  const model = buildScreenSpecWorkbookModel(doc)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scopery'
  addChangeHistory(wb, model)
  addLayout(wb, model)
  addDefines(wb, model)
  addProcesses(wb, model)
  addEvents(wb, model)
  addValidation(wb, model)
  addDatabase(wb, model)
  return wb
}

export { suggestScreenSpecExcelFilename }
