import { describe, expect, it } from 'vitest'
import { mapScreenFullSpec, mapScreenSpecDocFullSpec } from './spec-doc.api'

describe('mapScreenFullSpec', () => {
  it('reads nested screen payloads and alternate collection keys', () => {
    const spec = mapScreenFullSpec({
      screen: {
        id: 's1',
        code: 'LOGIN',
        name: 'Login',
        screen_fields: [
          {
            id: 'f1',
            fieldKey: 'email',
            label: 'Email',
            data_field: {
              id: 'df1',
              columnName: 'email',
              dataType: 'VARCHAR',
              data_entity: { code: 'users', name: 'User', table_name: 'users' },
            },
          },
        ],
        process_items: [{ id: 'p1', title: 'Init' }],
      },
    })
    expect(spec.code).toBe('LOGIN')
    expect(spec.fields).toHaveLength(1)
    expect(spec.fields[0].dataField?.tableName).toBe('users')
    expect(spec.fields[0].dataField?.entityName).toBe('User')
    expect(spec.processItems).toHaveLength(1)
  })
})

describe('mapScreenSpecDocFullSpec', () => {
  it('keeps screenId when BE only returns screen refs', () => {
    const doc = mapScreenSpecDocFullSpec({
      id: 'd1',
      documentCode: 'SPEC-001',
      documentName: 'Auth',
      screens: [{ screenId: 's1', code: 'LOGIN', name: 'Login', displayOrder: 1 }],
    })
    expect(doc.screens).toHaveLength(1)
    expect(doc.screens[0].screenId).toBe('s1')
    expect(doc.screens[0].screen.id).toBe('s1')
    expect(doc.screens[0].screen.code).toBe('LOGIN')
    expect(doc.screens[0].screen.fields).toEqual([])
  })
})
