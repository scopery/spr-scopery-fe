import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseAndValidateExcelList } from './excelListImport'
import { FUNCTIONAL_ITEM_IMPORT_SPEC, MODULE_IMPORT_SPEC } from './excelImportSpecs'

function workbookFromRows(rows: Record<string, string>[]): ArrayBuffer {
  const sheet = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('parseAndValidateExcelList', () => {
  it('parses valid module rows', () => {
    const buf = workbookFromRows([
      { code: 'CART', name: 'Cart', description: 'Shopping cart' },
      { code: 'IAM', name: 'Identity' },
    ])
    const res = parseAndValidateExcelList(buf, MODULE_IMPORT_SPEC)
    expect(res.issues).toEqual([])
    expect(res.rows).toHaveLength(2)
    expect(res.rows[0].code).toBe('CART')
  })

  it('fails when required column missing', () => {
    const buf = workbookFromRows([{ code: 'CART' }])
    const res = parseAndValidateExcelList(buf, MODULE_IMPORT_SPEC)
    expect(res.rows).toEqual([])
    expect(res.issues.some((i) => i.message.includes('name'))).toBe(true)
  })

  it('fails on duplicate codes in file', () => {
    const buf = workbookFromRows([
      { code: 'CART', name: 'Cart' },
      { code: 'CART', name: 'Cart 2' },
    ])
    const res = parseAndValidateExcelList(buf, MODULE_IMPORT_SPEC)
    expect(res.issues.some((i) => i.message.includes('Duplicate'))).toBe(true)
  })

  it('normalizes and validates FR enums', () => {
    const buf = workbookFromRows([
      {
        code: 'FR-1',
        title: 'Add',
        priority: 'high',
        type: 'functional',
        acceptanceCriteria: 'A | B',
      },
    ])
    const res = parseAndValidateExcelList(buf, FUNCTIONAL_ITEM_IMPORT_SPEC)
    expect(res.issues).toEqual([])
    expect(res.rows[0].priority).toBe('HIGH')
    expect(res.rows[0].type).toBe('FUNCTIONAL')
  })

  it('rejects invalid enum before import', () => {
    const buf = workbookFromRows([
      { code: 'FR-1', title: 'Add', priority: 'URGENT', type: 'FUNCTIONAL' },
    ])
    const res = parseAndValidateExcelList(buf, FUNCTIONAL_ITEM_IMPORT_SPEC)
    expect(res.issues.some((i) => i.column === 'priority')).toBe(true)
  })
})
