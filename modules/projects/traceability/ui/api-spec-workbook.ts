import ExcelJS from 'exceljs'
import {
  excelWriteBufferToArrayBuffer,
  safeExcelFileStem,
  triggerBrowserDownload,
} from '@/shared/lib/excel/download'
import type { RegistryApiEndpoint } from '../model/application-registry'
import {
  API_SPEC_EXCEL_HEADERS,
  API_SPEC_EXCEL_MERGED_COLS,
  API_SPEC_EXCEL_SHEET,
  buildApiSpecExcelModel,
  suggestApiSpecExcelFilename,
  type ApiSpecExcelRow,
} from '../model/api-spec-excel.rules'

const FONT: Partial<ExcelJS.Font> = { name: 'Century Gothic', size: 11, color: { argb: 'FF000000' } }
const HEADER_FONT: Partial<ExcelJS.Font> = {
  ...FONT,
  bold: true,
  color: { argb: 'FFFFFFFF' },
}
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
}

function paint(cell: ExcelJS.Cell, fill?: ExcelJS.Fill, font: Partial<ExcelJS.Font> = FONT) {
  cell.font = font
  cell.border = BORDER
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  if (fill) cell.fill = fill
}

function rowValues(row: ApiSpecExcelRow): string[] {
  return [
    row.method,
    row.path,
    row.name,
    row.description,
    row.paramName,
    row.paramIn,
    row.paramType,
    row.paramRequired,
    row.paramDescription,
    row.paramExample,
    row.responseSchema,
  ]
}

export async function downloadApiSpecExcel(
  endpoints: RegistryApiEndpoint[],
  applicationName?: string | null
): Promise<{ filename: string }> {
  const model = buildApiSpecExcelModel(endpoints)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Scopery'
  const sheet = wb.addWorksheet(API_SPEC_EXCEL_SHEET)

  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
  API_SPEC_EXCEL_HEADERS.forEach((header, i) => {
    const cell = sheet.getCell(1, i + 1)
    cell.value = header
    paint(cell, headerFill, HEADER_FONT)
  })
  sheet.getRow(1).height = 22

  model.rows.forEach((row, i) => {
    const excelRow = i + 2
    rowValues(row).forEach((value, col) => {
      const cell = sheet.getCell(excelRow, col + 1)
      cell.value = value
      paint(cell)
    })
    const tall = row.responseSchema.includes('\n') || row.description.length > 80
    sheet.getRow(excelRow).height = tall ? 48 : 20
  })

  for (const merge of model.merges) {
    const start = merge.start + 2
    const end = merge.end + 2
    for (const col of API_SPEC_EXCEL_MERGED_COLS) {
      sheet.mergeCells(start, col, end, col)
      paint(sheet.getCell(start, col))
    }
  }

  sheet.columns = [
    { width: 10 },
    { width: 28 },
    { width: 22 },
    { width: 36 },
    { width: 16 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
    { width: 24 },
    { width: 14 },
    { width: 40 },
  ]
  sheet.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await wb.xlsx.writeBuffer()
  const filename =
    safeExcelFileStem(suggestApiSpecExcelFilename(applicationName).replace(/\.xlsx$/i, ''), 'APIs') +
    '.xlsx'
  triggerBrowserDownload(excelWriteBufferToArrayBuffer(buffer), filename)
  return { filename }
}
