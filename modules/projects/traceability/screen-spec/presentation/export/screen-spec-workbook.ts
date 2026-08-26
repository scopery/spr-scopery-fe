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

function solid(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

const FILL = {
  teal: solid('FF4FA4C2'),
  orange: solid('FFE8813B'),
  terracotta: solid('FFD36A2A'),
  beige: solid('FFEFEDE2'),
  beigeDark: solid('FFE5E0D0'),
  grey: solid('FF595959'),
  labelGrey: solid('FFD9D9D9'),
  labelBlue: solid('FFD6E3F0'),
  metaLabel: solid('FFE2F0F4'),
  layoutHeader: solid('FFE7E6E6'),
  navy: solid('FF1F4E79'),
  maroon: solid('FF800000'),
  lavender: solid('FFCCC0DA'),
  white: solid('FFFFFFFF'),
}

interface SheetTheme {
  sidebar: ExcelJS.Fill
  label: ExcelJS.Fill
  value: ExcelJS.Fill
  tableHeader: ExcelJS.Fill
  tableHeaderFont: Partial<ExcelJS.Font>
  banner?: ExcelJS.Fill
  outlineHeading?: ExcelJS.Fill
  outlineHeadingFont?: Partial<ExcelJS.Font>
  outlineLabel?: ExcelJS.Fill
}

const THEME = {
  defines: {
    sidebar: FILL.grey,
    label: FILL.labelGrey,
    value: FILL.white,
    tableHeader: FILL.terracotta,
    tableHeaderFont: WHITE_BOLD,
    banner: FILL.orange,
  },
  processes: {
    sidebar: FILL.grey,
    label: FILL.labelGrey,
    value: FILL.white,
    tableHeader: FILL.navy,
    tableHeaderFont: WHITE_BOLD,
    outlineHeading: FILL.navy,
    outlineHeadingFont: WHITE_BOLD,
    outlineLabel: FILL.labelBlue,
  },
  event: {
    sidebar: FILL.grey,
    label: FILL.labelGrey,
    value: FILL.white,
    tableHeader: FILL.teal,
    tableHeaderFont: WHITE_BOLD,
    outlineHeading: FILL.teal,
    outlineHeadingFont: WHITE_BOLD,
    outlineLabel: FILL.labelBlue,
  },
  validation: {
    sidebar: FILL.grey,
    label: FILL.labelGrey,
    value: FILL.white,
    tableHeader: FILL.maroon,
    tableHeaderFont: WHITE_BOLD,
  },
  database: {
    sidebar: FILL.grey,
    label: FILL.labelGrey,
    value: FILL.white,
    tableHeader: FILL.lavender,
    tableHeaderFont: BOLD,
  },
  history: {
    sidebar: FILL.grey,
    label: FILL.labelGrey,
    value: FILL.white,
    tableHeader: FILL.navy,
    tableHeaderFont: WHITE_BOLD,
  },
  layout: {
    sidebar: FILL.teal,
    label: FILL.metaLabel,
    value: FILL.white,
    tableHeader: FILL.layoutHeader,
    tableHeaderFont: BOLD,
    banner: FILL.layoutHeader,
  },
} as const satisfies Record<string, SheetTheme>

const BLACK: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
}

const MIN_ROW_HEIGHT = 20
const LINE_HEIGHT = 15
const MAX_ROW_HEIGHT = 140
const HEADER_LAST_COL = 6
const EMPTY_HISTORY_ROWS = 8
const VALIDATION_NOTE =
  'All field validation rules, including Required and Max Length. Defines still shows Required / Length as a summary.'

// ── image helpers ─────────────────────────────────────────────────────────────

interface ExcelImage {
  buffer: ArrayBuffer
  extension: 'jpeg' | 'png' | 'gif'
  naturalWidth: number
  naturalHeight: number
}

async function fetchImageForExcel(url: string | null | undefined): Promise<ExcelImage | null> {
  if (!url?.trim()) return null
  try {
    const [dims, res] = await Promise.all([
      new Promise<{ width: number; height: number }>((resolve) => {
        if (typeof window === 'undefined') { resolve({ width: 0, height: 0 }); return }
        const img = new Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => resolve({ width: 0, height: 0 })
        img.src = url
        setTimeout(() => resolve({ width: 0, height: 0 }), 8000)
      }),
      fetch(url),
    ])
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const ct = res.headers.get('content-type') ?? ''
    const extension: 'jpeg' | 'png' | 'gif' = ct.includes('png') ? 'png' : ct.includes('gif') ? 'gif' : 'jpeg'
    return { buffer, extension, naturalWidth: dims.width, naturalHeight: dims.height }
  } catch {
    return null
  }
}

/** Returns row height in points to fit the image scaled to targetWidthPx. */
function scaledRowHeightPts(img: ExcelImage, targetWidthPx: number): number {
  if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return 120
  const scale = targetWidthPx / img.naturalWidth
  return Math.min(400, Math.max(MIN_ROW_HEIGHT, img.naturalHeight * scale * 0.75))
}

// ── sheet helpers ─────────────────────────────────────────────────────────────

function paint(
  cell: ExcelJS.Cell,
  fill?: ExcelJS.Fill,
  font: Partial<ExcelJS.Font> = FONT,
  alignment?: Partial<ExcelJS.Alignment>
) {
  cell.font = font
  cell.border = BLACK
  cell.alignment = {
    vertical: alignment?.vertical ?? 'top',
    horizontal: alignment?.horizontal ?? 'left',
    wrapText: true,
  }
  if (fill) cell.fill = fill
}

function excelMultiline(value: string | number): string | number {
  if (typeof value !== 'string') return value
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function heightForText(text: string, colWidth: number): number {
  const lines = text.split('\n').reduce((sum, line) => {
    return sum + Math.max(1, Math.ceil(line.length / Math.max(colWidth, 8)))
  }, 0)
  return Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, lines * LINE_HEIGHT))
}

function heightForValues(values: Array<string | number>, colWidths?: number[]): number {
  return values.reduce<number>((max, value, i) => {
    if (typeof value !== 'string' || !value) return max
    return Math.max(max, heightForText(value, colWidths?.[i] ?? 28))
  }, MIN_ROW_HEIGHT)
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

function freezeThrough(sheet: ExcelJS.Worksheet, lastFrozenRow: number) {
  sheet.views = [{ state: 'frozen', ySplit: lastFrozenRow, showGridLines: false }]
}

function writeLabelValuePair(
  sheet: ExcelJS.Worksheet,
  row: number,
  labelCol: number,
  valueCol: number,
  label: string,
  value: string,
  theme: SheetTheme
) {
  const labelCell = sheet.getCell(row, labelCol)
  labelCell.value = label
  paint(labelCell, FILL.metaLabel, BOLD)
  const valueCell = sheet.getCell(row, valueCol)
  valueCell.value = excelMultiline(value)
  paint(valueCell, theme.value)
}

function writeMeta(sheet: ExcelJS.Worksheet, header: ScreenSpecExcelHeader, theme: SheetTheme): number {
  sheet.mergeCells(2, 1, 6, 2)
  const common = sheet.getCell(2, 1)
  common.value = 'Common Information'
  paint(common, FILL.teal, WHITE_BOLD, { vertical: 'top' })
  paintRange(sheet, 2, 2, 2, FILL.teal, WHITE_BOLD, { vertical: 'top' })
  for (let r = 3; r <= 6; r++) {
    paintRange(sheet, r, 1, 2, FILL.teal, WHITE_BOLD, { vertical: 'top' })
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
    [2, 'Author', header.author],
    [3, 'Created Date', header.createdDate],
    [4, 'Version', header.version],
    [5, 'Updated By', header.updatedBy],
    [6, 'Updated Date', header.updatedDate],
  ]
  for (const [r, label, value] of commonLeft) writeLabelValuePair(sheet, r, 3, 4, label, value, theme)
  for (const [r, label, value] of commonRight) writeLabelValuePair(sheet, r, 5, 6, label, value, theme)

  sheet.mergeCells(7, 1, 9, 2)
  const screenInfo = sheet.getCell(7, 1)
  screenInfo.value = 'Screen Information'
  paint(screenInfo, FILL.teal, WHITE_BOLD, { vertical: 'top' })
  paintRange(sheet, 7, 2, 2, FILL.teal, WHITE_BOLD, { vertical: 'top' })
  for (let r = 8; r <= 9; r++) paintRange(sheet, r, 1, 2, FILL.teal, WHITE_BOLD, { vertical: 'top' })

  writeLabelValuePair(sheet, 7, 3, 4, 'Screen ID', header.screenIdText, theme)
  writeLabelValuePair(sheet, 8, 3, 4, 'Screen Name', header.screenNameText, theme)
  writeLabelValuePair(sheet, 9, 3, 4, 'Overview', header.overview, theme)
  sheet.mergeCells(9, 4, 9, 6)
  paint(sheet.getCell(9, 4), theme.value)
  paintRange(sheet, 9, 5, 6, theme.value)
  paintRange(sheet, 7, 5, 6, theme.value)
  paintRange(sheet, 8, 5, 6, theme.value)
  ensureRowHeight(sheet.getRow(7))
  ensureRowHeight(sheet.getRow(8))
  ensureRowHeight(sheet.getRow(9), header.overview ? 36 : MIN_ROW_HEIGHT)

  freezeThrough(sheet, 10)
  return 11
}

function writeTableHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, headers: string[], theme: SheetTheme) {
  headers.forEach((h, i) => {
    const cell = sheet.getCell(rowNumber, i + 1)
    cell.value = h
    paint(cell, theme.tableHeader, theme.tableHeaderFont, { horizontal: 'center', vertical: 'middle' })
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
  font: Partial<ExcelJS.Font> = FONT,
  colWidths?: number[]
) {
  const normalized = values.map(excelMultiline)
  normalized.forEach((v, i) => {
    const cell = sheet.getCell(rowNumber, i + 1)
    cell.value = v
    paint(cell, fill ?? FILL.white, font, {
      horizontal: i === 0 && values.length > 4 ? 'center' : 'left',
      vertical: 'top',
    })
  })
  ensureRowHeight(sheet.getRow(rowNumber), heightForValues(normalized, colWidths))
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
  theme: SheetTheme
): void {
  let r = startRow
  let headingIndex = 0
  const headingFill = theme.outlineHeading ?? theme.tableHeader
  const headingFont = theme.outlineHeadingFont ?? theme.tableHeaderFont
  const outlineLabel = theme.outlineLabel ?? theme.label
  rows.forEach((row, i) => {
    if (row.kind === 'screen') {
      writeBanner(sheet, r, lastCol, row.label, FILL.beigeDark, BOLD)
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
    paint(labelCell, outlineLabel, BOLD)
    sheet.mergeCells(r, 2, r, lastCol)
    const valueCell = sheet.getCell(r, 2)
    const value = excelMultiline(outlineValue(row))
    valueCell.value = value
    paint(valueCell, FILL.white, FONT, { vertical: 'top' })
    paintRange(sheet, r, 3, lastCol, FILL.white, FONT, { vertical: 'top' })
    ensureRowHeight(
      sheet.getRow(r),
      typeof value === 'string' ? heightForText(value, 48) : MIN_ROW_HEIGHT
    )
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

// ── sheet builders ────────────────────────────────────────────────────────────

function addChangeHistory(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.changeHistory)
  const start = writeMeta(sheet, model.header, THEME.history)
  const headers = ['Date', 'Rev.No', 'Target Sheet', 'Change Description', 'Owner', 'Color']
  writeTableHeaderRow(sheet, start, headers, THEME.history)
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

// Layout: px width of the 5 table columns (18+32+28+28+28 chars * 8px/char)
const LAYOUT_TABLE_PX = (18 + 32 + 28 + 28 + 28) * 8

async function addLayout(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.layout)
  const start = writeMeta(sheet, model.header, THEME.layout)
  writeBanner(sheet, start, HEADER_LAST_COL, 'Figma / UI Reference', THEME.layout.banner ?? FILL.layoutHeader, BOLD)
  sheet.mergeCells(start + 1, 1, start + 1, HEADER_LAST_COL)
  const url = sheet.getCell(start + 1, 1)
  url.value = model.header.figmaUrl
  paint(url, FILL.white)
  paintRange(sheet, start + 1, 2, HEADER_LAST_COL, FILL.white)
  ensureRowHeight(sheet.getRow(start + 1))

  const tableRow = start + 3
  const headers = ['Screen code', 'Screen name', 'Route', 'Modes', 'Notes']
  const lastCol = headers.length
  writeTableHeaderRow(sheet, tableRow, headers, THEME.layout)

  let r = tableRow + 1
  for (const row of model.layoutScreens) {
    writeBodyCells(sheet, r, [row.code, row.name, row.routePath, row.modes, row.note])
    r += 1

    if (row.mockupUrl) {
      const img = await fetchImageForExcel(row.mockupUrl)
      if (img) {
        // Title row
        sheet.mergeCells(r, 1, r, lastCol)
        const titleCell = sheet.getCell(r, 1)
        titleCell.value = 'Screenshot'
        paint(titleCell, FILL.labelGrey, BOLD)
        paintRange(sheet, r, 2, lastCol, FILL.labelGrey, BOLD)
        ensureRowHeight(sheet.getRow(r))
        r += 1

        // Image row
        const heightPts = scaledRowHeightPts(img, LAYOUT_TABLE_PX)
        const imgRow = sheet.getRow(r)
        imgRow.height = heightPts
        sheet.mergeCells(r, 1, r, lastCol)
        paint(sheet.getCell(r, 1), FILL.white)
        paintRange(sheet, r, 2, lastCol, FILL.white)

        const scaledH = img.naturalWidth > 0 ? img.naturalHeight * (LAYOUT_TABLE_PX / img.naturalWidth) : img.naturalHeight
        const imageId = wb.addImage({ buffer: img.buffer, extension: img.extension })
        sheet.addImage(imageId, {
          tl: { col: 0, row: r - 1 },
          ext: { width: LAYOUT_TABLE_PX, height: Math.round(scaledH) },
          editAs: 'oneCell',
        })
        r += 1
      }
    }
  }

  applySheetColumns(sheet, [18, 32, 28, 28, 28, 18])
}

// Defines: px width of the screenshot column (24 chars * 8px/char)
const SCREENSHOT_COL_CHARS = 24
const SCREENSHOT_COL_PX = SCREENSHOT_COL_CHARS * 8

async function addDefines(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.defines)
  const start = writeMeta(sheet, model.header, THEME.defines)
  const modeHeaders = model.modeCodes.map(defineModeColumnLabel)
  const headers = [
    'No',
    'Field',
    'Physical name',
    'Type',
    'Required',
    'Read-only',
    'Length',
    ...modeHeaders,
    'Default',
    'Table / Source',
    'Column / Attribute',
    'Remark',
    'Screenshot',
  ]
  const screenshotCol = headers.length  // 1-indexed
  writeBanner(sheet, start, headers.length, 'Field Data', THEME.defines.banner ?? FILL.orange, WHITE_BOLD)
  writeTableHeaderRow(sheet, start + 1, headers, THEME.defines)
  freezeThrough(sheet, start + 1)
  const defineWidths = [
    8, 28, 20, 14, 12, 12, 10,
    ...model.modeCodes.map(() => 12),
    16, 18, 20, 24, SCREENSHOT_COL_CHARS,
  ]

  // Track consecutive field rows sharing a componentId for image merging
  interface CompGroup {
    screenshotUrl: string
    startRow: number
    endRow: number
  }
  const compGroups: CompGroup[] = []
  let curGroup: { componentId: string; screenshotUrl: string; startRow: number } | null = null

  model.defineRows.forEach((row, i) => {
    const r = start + 2 + i
    const values: Array<string | number> = [
      row.no,
      row.field,
      row.physicalName,
      row.type,
      row.required,
      row.readonly,
      row.length,
      ...model.modeCodes.map((code) => row.modeMarks[code] ?? ''),
      row.defaultValue,
      row.table,
      row.columnAttribute,
      row.remark,
      '',  // Screenshot — filled by image later
    ]
    const fill = row.kind === 'screen' ? FILL.beigeDark : row.kind === 'section' ? FILL.beige : FILL.white
    const font = row.kind === 'field' ? FONT : BOLD
    writeBodyCells(sheet, r, values, fill, font, defineWidths)
    if (row.kind !== 'field') {
      sheet.mergeCells(r, 2, r, headers.length)
      paint(sheet.getCell(r, 2), fill, BOLD)
      paintRange(sheet, r, 3, headers.length, fill, BOLD)
    }

    // Group consecutive field rows by componentId for screenshot merging
    if (row.kind === 'field' && row.componentId && row.componentScreenshotUrl) {
      if (curGroup && curGroup.componentId === row.componentId) {
        // extend current group (endRow tracked implicitly via i)
      } else {
        if (curGroup) { const g = curGroup; compGroups.push({ ...g, endRow: r - 1 }) }
        curGroup = { componentId: row.componentId, screenshotUrl: row.componentScreenshotUrl, startRow: r }
      }
    } else {
      if (curGroup) { const g = curGroup; compGroups.push({ ...g, endRow: r - 1 }); curGroup = null }
    }
  })
  if (curGroup) { const g = curGroup; compGroups.push({ ...g, endRow: start + 2 + model.defineRows.length - 1 }) }

  // Insert component screenshot images
  for (const group of compGroups) {
    const img = await fetchImageForExcel(group.screenshotUrl)
    if (!img) continue

    // Merge screenshot column for the group
    if (group.startRow < group.endRow) {
      sheet.mergeCells(group.startRow, screenshotCol, group.endRow, screenshotCol)
    }
    paint(sheet.getCell(group.startRow, screenshotCol), FILL.white)

    // Set row heights proportionally so total height fits image
    const totalHeightPts = scaledRowHeightPts(img, SCREENSHOT_COL_PX)
    const numRows = group.endRow - group.startRow + 1
    const perRowPts = totalHeightPts / numRows
    for (let rowIdx = group.startRow; rowIdx <= group.endRow; rowIdx++) {
      const exRow = sheet.getRow(rowIdx)
      exRow.height = Math.max(exRow.height || MIN_ROW_HEIGHT, perRowPts)
    }

    const scaledH = img.naturalWidth > 0
      ? img.naturalHeight * (SCREENSHOT_COL_PX / img.naturalWidth)
      : img.naturalHeight
    const imageId = wb.addImage({ buffer: img.buffer, extension: img.extension })
    sheet.addImage(imageId, {
      tl: { col: screenshotCol - 1, row: group.startRow - 1 },
      ext: { width: SCREENSHOT_COL_PX, height: Math.round(scaledH) },
      editAs: 'oneCell',
    })
  }

  applySheetColumns(sheet, defineWidths)
}

function addProcesses(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.processes)
  const start = writeMeta(sheet, model.header, THEME.processes)
  writeOutlineBlocks(sheet, start, model.processRows, HEADER_LAST_COL, THEME.processes)
  applySheetColumns(sheet, [18, 22, 18, 28, 16, 18])
}

function addEvents(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.event)
  const start = writeMeta(sheet, model.header, THEME.event)
  writeOutlineBlocks(sheet, start, model.eventRows, HEADER_LAST_COL, THEME.event)
  applySheetColumns(sheet, [18, 22, 18, 28, 16, 18])
}

function addValidation(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.validation)
  const start = writeMeta(sheet, model.header, THEME.validation)
  sheet.mergeCells(start, 1, start, 9)
  const note = sheet.getCell(start, 1)
  note.value = VALIDATION_NOTE
  paint(note, FILL.white, NOTE_FONT)
  paintRange(sheet, start, 2, 9, FILL.white, NOTE_FONT)
  ensureRowHeight(sheet.getRow(start), 32)

  const headers = [
    'No',
    'Field',
    'Physical name',
    'Mode',
    'Validation Rule',
    'Param',
    'Individual rule',
    'Individual message',
    'Remark',
  ]
  writeTableHeaderRow(sheet, start + 1, headers, THEME.validation)
  freezeThrough(sheet, start + 1)
  const validationWidths = [8, 24, 20, 12, 18, 22, 24, 36, 20]
  model.validationRows.forEach((row, i) => {
    const r = start + 2 + i
    const fill = row.kind === 'screen' ? FILL.beigeDark : row.kind === 'section' ? FILL.beige : FILL.white
    const font = row.kind === 'rule' ? FONT : BOLD
    writeBodyCells(
      sheet,
      r,
      [
        row.no,
        row.field,
        row.physicalName,
        row.mode,
        row.ruleType,
        row.params,
        row.individualRule,
        row.errorMessage,
        row.remark,
      ],
      fill,
      font,
      validationWidths
    )
    if (row.kind !== 'rule') {
      sheet.mergeCells(r, 2, r, headers.length)
      paint(sheet.getCell(r, 2), fill, BOLD)
      paintRange(sheet, r, 3, headers.length, fill, BOLD)
    }
  })
  applySheetColumns(sheet, validationWidths)
}

function addDatabase(wb: ExcelJS.Workbook, model: ScreenSpecWorkbookModel) {
  const sheet = wb.addWorksheet(SCREEN_SPEC_EXCEL_SHEETS.database)
  const start = writeMeta(sheet, model.header, THEME.database)
  const headers = ['No', 'Data Source', 'Purpose / Attributes Used', 'Notes']
  writeTableHeaderRow(sheet, start, headers, THEME.database)
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
  await addLayout(wb, model)
  await addDefines(wb, model)
  addProcesses(wb, model)
  addEvents(wb, model)
  addValidation(wb, model)
  addDatabase(wb, model)
  return wb
}

export { suggestScreenSpecExcelFilename }
