import { describe, expect, it } from 'vitest'
import { validateRequirementJsonImport } from './requirement-json-import.validation'

describe('validateRequirementJsonImport', () => {
  it('accepts CRITICAL / SECURITY / COMPLIANCE aliases and maps them', () => {
    const result = validateRequirementJsonImport([
      {
        title: 'Login',
        code: 'REQ-1',
        requirementType: 'FUNCTIONAL',
        priority: 'CRITICAL',
      },
      {
        title: 'Protect passwords',
        code: 'REQ-2',
        requirementType: 'SECURITY',
        priority: 'HIGH',
      },
      {
        title: 'Account deletion',
        code: 'REQ-3',
        requirementType: 'COMPLIANCE',
        priority: 'MEDIUM',
      },
    ])

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items[0].priority).toBe('HIGH')
    expect(result.items[1].requirementType).toBe('CONSTRAINT')
    expect(result.items[2].requirementType).toBe('CONSTRAINT')
  })
})
