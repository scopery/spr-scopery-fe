import { describe, expect, it } from 'vitest'
import {
  resolveFieldValidationImports,
  validateFieldValidationJsonImport,
} from './validation-import.validation'

describe('validateFieldValidationJsonImport', () => {
  it('accepts fieldKey + ruleTypeCode and parses ruleParamJson', () => {
    const result = validateFieldValidationJsonImport([
      {
        fieldKey: 'email',
        ruleTypeCode: 'EMAIL',
        errorMessage: 'Invalid email',
      },
      {
        fieldKey: 'email',
        ruleTypeCode: 'MAX_LENGTH',
        ruleParamJson: { maxLength: 255 },
        modeCode: 'CREATE',
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items).toHaveLength(2)
    expect(result.items[1].ruleParamJson).toEqual({ maxLength: 255 })
    expect(result.items[1].modeCode).toBe('CREATE')
  })

  it('rejects missing fieldKey and unknown keys', () => {
    const result = validateFieldValidationJsonImport([
      { ruleTypeCode: 'EMAIL', extra: true },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('fieldKey'))).toBe(true)
    expect(result.issues.some((issue) => issue.path.includes('extra'))).toBe(true)
  })
})

describe('resolveFieldValidationImports', () => {
  const refs = {
    fields: [{ id: 'f1', fieldKey: 'email' }],
    modes: [{ id: 'm1', modeCode: 'CREATE' }],
    ruleTypes: [
      { id: 'rt-email', code: 'EMAIL' },
      { id: 'rt-max', code: 'MAX_LENGTH' },
    ],
  }

  it('maps codes to ids', () => {
    const result = resolveFieldValidationImports(
      [
        {
          fieldKey: 'email',
          ruleTypeCode: 'email',
          modeCode: 'CREATE',
          errorMessage: 'Invalid email',
        },
      ],
      refs
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items[0].fieldId).toBe('f1')
    expect(result.items[0].body.ruleTypeId).toBe('rt-email')
    expect(result.items[0].body.modeId).toBe('m1')
  })

  it('rejects unknown field, rule, or mode on this screen', () => {
    const result = resolveFieldValidationImports(
      [
        { fieldKey: 'password', ruleTypeCode: 'EMAIL' },
        { fieldKey: 'email', ruleTypeCode: 'REGEX' },
        { fieldKey: 'email', ruleTypeCode: 'EMAIL', modeCode: 'VIEW' },
      ],
      refs
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.message.includes('password'))).toBe(true)
    expect(result.issues.some((issue) => issue.message.includes('REGEX'))).toBe(true)
    expect(result.issues.some((issue) => issue.message.includes('VIEW'))).toBe(true)
  })
})
