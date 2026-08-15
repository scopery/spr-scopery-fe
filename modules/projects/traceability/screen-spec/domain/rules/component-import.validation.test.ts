import { describe, expect, it } from 'vitest'
import { validateComponentFullSpecJsonImport } from './component-import.validation'

describe('validateComponentFullSpecJsonImport', () => {
  it('accepts a component with nested fields', () => {
    const result = validateComponentFullSpecJsonImport([
      {
        code: 'DROPDOWN_USER',
        name: 'User Dropdown',
        componentType: 'DROPDOWN',
        fields: [
          { fieldKey: 'value', label: 'Value', fieldType: 'TEXT', displayOrder: 0 },
          { fieldKey: 'label', label: 'Label', fieldType: 'TEXT', displayOrder: 1 },
        ],
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items[0].fields).toHaveLength(2)
    expect(result.items[0].fields?.[0].fieldKey).toBe('value')
  })

  it('accepts a shell component without fields', () => {
    const result = validateComponentFullSpecJsonImport([
      { code: 'BTN_PRIMARY', name: 'Primary button' },
    ])
    expect(result.ok).toBe(true)
  })

  it('rejects options or API links on the component', () => {
    const result = validateComponentFullSpecJsonImport([
      {
        code: 'BTN',
        name: 'Button',
        options: [{ optionValue: 'A' }],
      },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('options'))).toBe(true)
  })

  it('rejects duplicate fieldKey in the same component', () => {
    const result = validateComponentFullSpecJsonImport([
      {
        code: 'BTN',
        name: 'Button',
        fields: [
          { fieldKey: 'value', label: 'A', fieldType: 'TEXT' },
          { fieldKey: 'value', label: 'B', fieldType: 'TEXT' },
        ],
      },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('fieldKey'))).toBe(true)
  })
})
