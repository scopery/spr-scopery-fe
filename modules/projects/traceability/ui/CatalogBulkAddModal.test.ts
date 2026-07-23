import { describe, expect, it } from 'vitest'
import { parseClipboardToRows } from './CatalogBulkAddModal'

const MODULE_COLS = [
  { key: 'code' as const, label: 'Code', required: true },
  { key: 'name' as const, label: 'Name', required: true },
  { key: 'extra' as const, label: 'Description' },
]

describe('parseClipboardToRows', () => {
  it('parses TSV rows from Excel', () => {
    const text = 'CART\tCart\tShopping\nAUTH\tAuth\t'
    const rows = parseClipboardToRows(text, MODULE_COLS)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ code: 'CART', name: 'Cart', extra: 'Shopping' })
    expect(rows[1]).toMatchObject({ code: 'AUTH', name: 'Auth', extra: '' })
  })

  it('skips a header row', () => {
    const text = 'Code\tName\tDescription\nM1\tModule 1\tDesc'
    const rows = parseClipboardToRows(text, MODULE_COLS)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ code: 'M1', name: 'Module 1', extra: 'Desc' })
  })

  it('returns empty for blank clipboard', () => {
    expect(parseClipboardToRows('   ', MODULE_COLS)).toEqual([])
  })
})
