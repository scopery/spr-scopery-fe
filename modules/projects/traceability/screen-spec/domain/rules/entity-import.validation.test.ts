import { describe, expect, it } from 'vitest'
import { validateEntityFullSpecJsonImport } from './entity-import.validation'

const PROJECT_ID = '11111111-1111-4111-8111-111111111111'

describe('validateEntityFullSpecJsonImport', () => {
  it('accepts an entity with nested fields and fills projectId from the default', () => {
    const result = validateEntityFullSpecJsonImport(
      [
        {
          code: 'CART_ITEM',
          name: 'Cart item',
          tableName: 'cart_items',
          fields: [
            { columnName: 'id', dataType: 'uuid', isPrimaryKey: true, displayOrder: 0 },
            { columnName: 'qty', dataType: 'INTEGER', isNullable: false, displayOrder: 1 },
          ],
        },
      ],
      PROJECT_ID
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items[0].projectId).toBe(PROJECT_ID)
    expect(result.items[0].fields).toHaveLength(2)
    expect(result.items[0].fields?.[0].dataType).toBe('UUID')
    expect(result.items[0].fields?.[0].isPrimaryKey).toBe(true)
    expect(result.items[0].fields?.[0].isNullable).toBe(false)
  })

  it('accepts a shell entity without fields', () => {
    const result = validateEntityFullSpecJsonImport(
      [{ projectId: PROJECT_ID, code: 'CART', name: 'Cart' }],
      null
    )
    expect(result.ok).toBe(true)
  })

  it('rejects missing projectId when no default is provided', () => {
    const result = validateEntityFullSpecJsonImport([{ code: 'CART', name: 'Cart' }])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('projectId'))).toBe(true)
  })

  it('rejects unknown keys such as relations', () => {
    const result = validateEntityFullSpecJsonImport(
      [{ projectId: PROJECT_ID, code: 'CART', name: 'Cart', relations: [] }],
      null
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('relations'))).toBe(true)
  })

  it('rejects an unknown dataType', () => {
    const result = validateEntityFullSpecJsonImport(
      [
        {
          projectId: PROJECT_ID,
          code: 'CART',
          name: 'Cart',
          fields: [{ columnName: 'id', dataType: 'STRING' }],
        },
      ],
      null
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('dataType'))).toBe(true)
  })

  it('rejects duplicate columnName in the same entity', () => {
    const result = validateEntityFullSpecJsonImport(
      [
        {
          projectId: PROJECT_ID,
          code: 'CART',
          name: 'Cart',
          fields: [
            { columnName: 'id', dataType: 'UUID' },
            { columnName: 'ID', dataType: 'VARCHAR' },
          ],
        },
      ],
      null
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('columnName'))).toBe(true)
  })
})
