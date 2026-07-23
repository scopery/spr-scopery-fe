import * as XLSX from 'xlsx'

export interface ExcelColumnSpec {
  key: string
  required?: boolean
  /** Allowed values (exact match after trim/upper if normalizeEnum). */
  enumValues?: readonly string[]
  normalizeEnum?: boolean
}

export interface ExcelListImportSpec {
  /** Shown to user / agent as instruction. */
  instruction: string
  columns: ExcelColumnSpec[]
}

export interface ExcelParseIssue {
  row: number
  column?: string
  message: string
}

export interface ExcelListParseResult {
  rows: Record<string, string>[]
  issues: ExcelParseIssue[]
}

function normalizeHeader(raw: string): string {
  return raw.trim().replace(/[\s-]+/g, '').toLowerCase()
}

function cellToString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return String(value).trim()
}

/**
 * Reads the first worksheet as a list of objects keyed by spec column keys.
 * Validates required fields, enums, and duplicate `code` (or composite) within the file.
 */
export function parseAndValidateExcelList(
  data: ArrayBuffer,
  spec: ExcelListImportSpec,
  options?: { uniqueKeys?: string[] }
): ExcelListParseResult {
  const workbook = XLSX.read(data, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], issues: [{ row: 0, message: 'Workbook has no sheets' }] }
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  })

  if (rawRows.length === 0) {
    return { rows: [], issues: [{ row: 0, message: 'Sheet is empty (no data rows)' }] }
  }

  const headerMap = new Map<string, string>()
  const firstKeys = Object.keys(rawRows[0] ?? {})
  for (const header of firstKeys) {
    headerMap.set(normalizeHeader(header), header)
  }

  const issues: ExcelParseIssue[] = []
  for (const col of spec.columns) {
    if (col.required && !headerMap.has(normalizeHeader(col.key))) {
      issues.push({
        row: 0,
        column: col.key,
        message: `Missing required column "${col.key}"`,
      })
    }
  }
  if (issues.length > 0) {
    return { rows: [], issues }
  }

  const rows: Record<string, string>[] = []
  const uniqueKeys = options?.uniqueKeys ?? ['code']
  const seen = new Set<string>()

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2 // header is row 1
    const mapped: Record<string, string> = {}
    let allEmpty = true

    for (const col of spec.columns) {
      const sourceHeader = headerMap.get(normalizeHeader(col.key))
      let value = sourceHeader ? cellToString(raw[sourceHeader]) : ''
      if (col.normalizeEnum && value) value = value.toUpperCase()
      mapped[col.key] = value
      if (value) allEmpty = false
    }

    if (allEmpty) return

    for (const col of spec.columns) {
      const value = mapped[col.key] ?? ''
      if (col.required && !value) {
        issues.push({
          row: rowNumber,
          column: col.key,
          message: `"${col.key}" is required`,
        })
        continue
      }
      if (value && col.enumValues && col.enumValues.length > 0) {
        const allowed = col.normalizeEnum
          ? col.enumValues.map((v) => v.toUpperCase())
          : [...col.enumValues]
        const check = col.normalizeEnum ? value.toUpperCase() : value
        if (!allowed.includes(check)) {
          issues.push({
            row: rowNumber,
            column: col.key,
            message: `"${col.key}" must be one of: ${col.enumValues.join(', ')}`,
          })
        }
      }
    }

    const uniqueValue = uniqueKeys.map((k) => mapped[k] ?? '').join('::')
    if (uniqueKeys.every((k) => mapped[k]) && seen.has(uniqueValue)) {
      issues.push({
        row: rowNumber,
        message: `Duplicate ${uniqueKeys.join('+')} "${uniqueValue.replace(/::/g, ' ')}" in file`,
      })
    } else if (uniqueKeys.every((k) => mapped[k])) {
      seen.add(uniqueValue)
    }

    rows.push(mapped)
  })

  if (rows.length === 0 && issues.length === 0) {
    issues.push({ row: 0, message: 'No data rows found' })
  }

  return { rows, issues }
}

export type ExcelImportRowResult =
  | { status: 'created'; row: number }
  | { status: 'skipped'; row: number; reason: string }
  | { status: 'failed'; row: number; reason: string }

export interface ExcelImportRunSummary {
  created: number
  skipped: number
  failed: number
  results: ExcelImportRowResult[]
}
