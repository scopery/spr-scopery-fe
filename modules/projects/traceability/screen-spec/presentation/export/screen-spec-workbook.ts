import ExcelJS from 'exceljs'
import {
  SCREEN_SPEC_EXCEL_SHEETS,
  buildScreenSpecWorkbookModel,
  defineModeColumnLabel,
  suggestScreenSpecExcelFilename,
  type ScreenSpecExcelHeader,
  type ScreenSpecWorkbookModel,
} from '../../domain/rules/screen-spec-excel.rules'
import type { ScreenSpecDocFullSpec } from '../../domain/model/screen-spec-doc'

const FONT_NAME = 'Calibri'
const FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 11, color: { argb: 'FF000000' } }
const BOLD: Partial<ExcelJS.Font> = { ...FONT, bold: true }
const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: FONT_NAME,
  size: 14,
  bold: true,
  color: { argb: 'FFFFFFFF' },
}

const NAVY_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F4E79' },
}
const LIGHT_BLUE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFBDD7EE' },
}
const GROUP_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF9DC3E6' },
}
const SECTION_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDDEBF7' },
}

const BLACK: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
}

const MIN_ROW_HEIGHT = 20
const TABLE_START_ROW = 12
const EMPTY_HISTORY_ROWS = 8

function paint(cell: ExcelJS.Cell, fill?: ExcelJS.Fill, font: Partial<ExcelJS.Font> = FONT) {
  cell.font = font
  cell.border = BLACK
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  if (fill) cell.fill = fill
}

function ensureRowHeight(row: ExcelJS.Row) {
  if (!row.height || row.height < MIN_ROW_HEIGHT) row.height = MIN_ROW_HEIGHT
}

function writeMeta(sheet: ExcelJS.Worksheet, header: ScreenSpecExcelHeader, colCount: number): number {
  const lastCol = Math.max(colCount, 5)
  const title = header.grouped
    ? header.documentName
    : `Screen: ${header.screenNameText || header.documentName}`

  sheet.mergeCells(1, 1, 1, lastCol)
  const titleCell = sheet.getCell(1, 1)
  titleCell.value = title
  paint(titleCell, NAVY_FILL, TITLE_FONT)
  for (let c = 2; c <= lastCol; c++) paint(sheet.getCell(1, c), NAVY_FILL, TITLE_FONT)
  ensureRowHeight(sheet.getRow(1))

  const rows: Array<[string, string]> = [
    ['Document code', header.documentCode],
    ['Project', header.projectName],
    ['System', header.systemName],
    ['Phase', header.phaseName],
    ['Language', header.language],
    ['Screen ID', header.screenIdText],
    ['Screen name', header.screenNameText],
    ['Overview', header.overview],
    ['Mockup URL', header.figmaUrl],
  ]
  rows.forEach((pair, i) => {
    const r = i + 2
    sheet.mergeCells(r, 2, r, lastCol)
    const label = sheet.getCell(r, 1)
    label.value = pair[0]
    paint(label, LIGHT_BLUE_FILL, BOLD)
    const value = sheet.getCell(r, 2)
    value.value = pair[1]
    paint(value)
    for (let c = 3; c <= lastCol; c++) paint(sheet.getCell(r, c))
    ensureRowHeight(sheet.getRow(r))
  })

  return TABLE_START_ROW
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, colCount: number) {
  const row = sheet.getRow(rowNumber)
  ensureRowHeight(row)
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c)
    paint(cell, LIGHT_BLUE_FILL, BOLD)
  }
}

function styleBodyRow(sheet: ExcelJS.Worksheet, rowNumber: number, colCount: number, fill?: ExcelJS.Fill) {
  const row = sheet.getRow(rowNumber)
  ensureRowHeight(row)
  for (let c = 1; c <= colCount; c++) {
    paint(row.getCell(c), fill)
  }
}

function writeHeaderCells(sheet: ExcelJS.Worksheet, rowNumber: number, headers: string[]) {
  headers.forEach((h, i) => {
    sheet.getCell(rowNumber, i + 1).value = h
  })
  styleHeaderRow(sheet, rowNumber, headers.length)
}

function addChangeHistory(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.changeHistory)
  const headers = ['Rev', 'Sheet', 'Details', 'Person', 'Date']
  const start = writeMeta(sheet, model.header, headers.length)
  writeHeaderCells(sheet, start, headers)
  const bodyCount = Math.max(model.revisions.length, EMPTY_HISTORY_ROWS)
  for (let i = 0; i < bodyCount; i++) {
    const r = start + 1 + i
    const rev = model.revisions[i]
    if (rev) {
      sheet.getRow(r).values = [
        undefined,
        rev.revisionNo,
        rev.targetSheetName,
        rev.details,
        rev.personInCharge,
        rev.changedAt,
      ]
    }
    styleBodyRow(sheet, r, headers.length)
  }
  sheet.columns = [
    { width: 12 },
    { width: 16 },
    { width: 48 },
    { width: 18 },
    { width: 14 },
  ]
}

function addLayout(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.layout)
  const headers = ['Code', 'Name', 'Route', 'Modes', 'Note']
  const start = writeMeta(sheet, model.header, headers.length)
  writeHeaderCells(sheet, start, headers)
  model.layoutScreens.forEach((row, i) => {
    const r = start + 1 + i
    sheet.getRow(r).values = [undefined, row.code, row.name, row.routePath, row.modes, row.note]
    styleBodyRow(sheet, r, headers.length)
  })
  sheet.columns = [{ width: 16 }, { width: 32 }, { width: 28 }, { width: 28 }, { width: 24 }]
}

function addDefines(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.defines)
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
    'Table',
    ...(model.header.grouped ? ['Screen'] : []),
  ]
  const start = writeMeta(sheet, model.header, headers.length)
  writeHeaderCells(sheet, start, headers)

  model.defineRows.forEach((row, i) => {
    const r = start + 1 + i
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
    ]
    if (model.header.grouped) values.push(row.screenCode)
    values.forEach((v, c) => {
      sheet.getCell(r, c + 1).value = v
    })
    const fill = row.kind === 'screen' ? GROUP_FILL : row.kind === 'section' ? SECTION_FILL : undefined
    styleBodyRow(sheet, r, headers.length, fill)
    if (row.kind === 'screen' || row.kind === 'section') {
      sheet.getCell(r, 2).font = BOLD
    }
  })

  sheet.columns = [
    { width: 8 },
    { width: 28 },
    { width: 22 },
    { width: 14 },
    { width: 12 },
    { width: 10 },
    ...model.modeCodes.map(() => ({ width: 12 })),
    { width: 16 },
    { width: 18 },
    ...(model.header.grouped ? [{ width: 14 }] : []),
  ]
}

function addOutlineSheet(
  wb: ExcelJS.Workbook,
  name: string,
  model: ScreenSpecWorkbookModel,
  rows: ScreenSpecWorkbookModel['processRows'],
  extraHeader: string
) {
  const sheet = wb.addWorksheet(name)
  const headers = ['Item', 'Detail', 'Source / Table', 'Condition', extraHeader]
  const start = writeMeta(sheet, model.header, headers.length)
  writeHeaderCells(sheet, start, headers)
  rows.forEach((row, i) => {
    const r = start + 1 + i
    const values = [
      row.label,
      row.detail,
      row.source,
      row.condition,
      row.extra || (model.header.grouped ? row.screenCode : ''),
    ]
    values.forEach((v, c) => {
      sheet.getCell(r, c + 1).value = v
    })
    const fill = row.kind === 'screen' ? GROUP_FILL : undefined
    styleBodyRow(sheet, r, headers.length, fill)
    if (row.kind === 'screen' || row.kind === 'heading') {
      sheet.getCell(r, 1).font = BOLD
    }
  })
  sheet.columns = [{ width: 28 }, { width: 48 }, { width: 22 }, { width: 28 }, { width: 16 }]
}

function addValidation(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.validation)
  const headers = ['Screen', 'Field', 'Physical name', 'Rule', 'Params', 'Mode', 'Error message', 'Remark']
  const start = writeMeta(sheet, model.header, headers.length)
  writeHeaderCells(sheet, start, headers)
  model.validationRows.forEach((row, i) => {
    const r = start + 1 + i
    const values = [
      row.screenCode,
      row.field,
      row.physicalName,
      row.ruleType,
      row.params,
      row.mode,
      row.errorMessage,
      row.remark,
    ]
    values.forEach((v, c) => {
      sheet.getCell(r, c + 1).value = v
    })
    styleBodyRow(sheet, r, headers.length)
  })
  sheet.columns = [
    { width: 14 },
    { width: 24 },
    { width: 20 },
    { width: 16 },
    { width: 24 },
    { width: 12 },
    { width: 36 },
    { width: 20 },
  ]
}

function addDatabase(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.database)
  const headers = ['Table']
  const start = writeMeta(sheet, model.header, 5)
  writeHeaderCells(sheet, start, headers)
  model.databaseTables.forEach((name, i) => {
    const r = start + 1 + i
    sheet.getCell(r, 1).value = name
    styleBodyRow(sheet, r, headers.length)
  })
  sheet.columns = [{ width: 32 }]
}

export async function buildScreenSpecExcelWorkbook(doc: ScreenSpecDocFullSpec): Promise<ExcelJS.Workbook> {
  const model = buildScreenSpecWorkbookModel(doc)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scopery'
  addChangeHistory(wb, model)
  addLayout(wb, model)
  addDefines(wb, model)
  addOutlineSheet(wb, SCREEN_SPEC_EXCEL_SHEETS.processes, model, model.processRows, 'Screen')
  addOutlineSheet(wb, SCREEN_SPEC_EXCEL_SHEETS.event, model, model.eventRows, 'Navigate / Screen')
  addValidation(wb, model)
  addDatabase(wb, model)
  return wb
}

export { suggestScreenSpecExcelFilename }
