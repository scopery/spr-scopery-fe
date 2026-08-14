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
const GROUP_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE5E7EB' },
}
const SECTION_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
}
const COL_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD1D5DB' },
}
const THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
}

function writeMeta(sheet: ExcelJS.Worksheet, header: ScreenSpecExcelHeader): number {
  sheet.getCell('A1').value = header.documentName
  sheet.getCell('A1').font = TITLE_FONT
  sheet.mergeCells('A1:F1')

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
    sheet.getCell(`A${r}`).value = pair[0]
    sheet.getCell(`A${r}`).font = HEADER_FONT
    sheet.getCell(`B${r}`).value = pair[1]
    sheet.mergeCells(`B${r}:F${r}`)
  })
  return 12
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, colCount: number) {
  const row = sheet.getRow(rowNumber)
  row.font = HEADER_FONT
  row.height = 20
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c)
    cell.fill = COL_HEADER_FILL
    cell.border = THIN
    cell.alignment = { vertical: 'middle', wrapText: true }
  }
}

function applyBodyFont(sheet: ExcelJS.Worksheet) {
  sheet.eachRow((row) => {
    row.font = { ...FONT, ...(row.font ?? {}) }
  })
}

function addChangeHistory(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.changeHistory)
  const start = writeMeta(sheet, model.header)
  const headers = ['Rev', 'Sheet', 'Details', 'Person', 'Date']
  headers.forEach((h, i) => {
    sheet.getCell(start, i + 1).value = h
  })
  styleHeaderRow(sheet, start, headers.length)
  model.revisions.forEach((rev, i) => {
    const r = start + 1 + i
    sheet.getRow(r).values = [
      undefined,
      rev.revisionNo,
      rev.targetSheetName,
      rev.details,
      rev.personInCharge,
      rev.changedAt,
    ]
    for (let c = 1; c <= headers.length; c++) sheet.getCell(r, c).border = THIN
  })
  sheet.columns = [
    { width: 12 },
    { width: 16 },
    { width: 48 },
    { width: 18 },
    { width: 14 },
  ]
  applyBodyFont(sheet)
}

function addLayout(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.layout)
  const start = writeMeta(sheet, model.header)
  const headers = ['Code', 'Name', 'Route', 'Modes', 'Note']
  headers.forEach((h, i) => {
    sheet.getCell(start, i + 1).value = h
  })
  styleHeaderRow(sheet, start, headers.length)
  model.layoutScreens.forEach((row, i) => {
    const r = start + 1 + i
    sheet.getRow(r).values = [undefined, row.code, row.name, row.routePath, row.modes, row.note]
    for (let c = 1; c <= headers.length; c++) sheet.getCell(r, c).border = THIN
  })
  sheet.columns = [{ width: 16 }, { width: 32 }, { width: 28 }, { width: 28 }, { width: 24 }]
  applyBodyFont(sheet)
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
    'Table',
    ...(model.header.grouped ? ['Screen'] : []),
  ]
  headers.forEach((h, i) => {
    sheet.getCell(start, i + 1).value = h
  })
  styleHeaderRow(sheet, start, headers.length)

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
      sheet.getCell(r, c + 1).border = THIN
    })
    if (row.kind === 'screen') {
      for (let c = 1; c <= headers.length; c++) sheet.getCell(r, c).fill = GROUP_FILL
      sheet.getCell(r, 2).font = HEADER_FONT
    }
    if (row.kind === 'section') {
      for (let c = 1; c <= headers.length; c++) sheet.getCell(r, c).fill = SECTION_FILL
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
  applyBodyFont(sheet)
}

function addOutlineSheet(
  wb: ExcelJS.Workbook,
  name: string,
  model: ScreenSpecWorkbookModel,
  rows: ScreenSpecWorkbookModel['processRows'],
  extraHeader: string
) {
  const sheet = wb.addWorksheet(name)
  const start = writeMeta(sheet, model.header)
  const headers = ['Item', 'Detail', 'Source / Table', 'Condition', extraHeader]
  headers.forEach((h, i) => {
    sheet.getCell(start, i + 1).value = h
  })
  styleHeaderRow(sheet, start, headers.length)
  rows.forEach((row, i) => {
    const r = start + 1 + i
    const values = [row.label, row.detail, row.source, row.condition, row.extra || (model.header.grouped ? row.screenCode : '')]
    values.forEach((v, c) => {
      sheet.getCell(r, c + 1).value = v
      sheet.getCell(r, c + 1).border = THIN
    })
    if (row.kind === 'screen') {
      for (let c = 1; c <= headers.length; c++) sheet.getCell(r, c).fill = GROUP_FILL
      sheet.getCell(r, 1).font = HEADER_FONT
    }
    if (row.kind === 'heading') {
      sheet.getCell(r, 1).font = HEADER_FONT
    }
  })
  sheet.columns = [{ width: 28 }, { width: 48 }, { width: 22 }, { width: 28 }, { width: 16 }]
  applyBodyFont(sheet)
}

function addValidation(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.validation)
  const start = writeMeta(sheet, model.header)
  const headers = ['Screen', 'Field', 'Physical name', 'Rule', 'Params', 'Mode', 'Error message', 'Remark']
  headers.forEach((h, i) => {
    sheet.getCell(start, i + 1).value = h
  })
  styleHeaderRow(sheet, start, headers.length)
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
      sheet.getCell(r, c + 1).border = THIN
    })
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
  applyBodyFont(sheet)
}

function addDatabase(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.database)
  const start = writeMeta(sheet, model.header)
  sheet.getCell(start, 1).value = 'Table'
  styleHeaderRow(sheet, start, 1)
  model.databaseTables.forEach((name, i) => {
    const r = start + 1 + i
    sheet.getCell(r, 1).value = name
    sheet.getCell(r, 1).border = THIN
  })
  sheet.columns = [{ width: 32 }]
  applyBodyFont(sheet)
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
