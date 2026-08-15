import { describe, expect, it } from 'vitest'
import { validateScreenFullSpecJsonImport } from './screen-spec-import.validation'

describe('validateScreenFullSpecJsonImport', () => {
  it('accepts a nested screen and injects default projectId', () => {
    const result = validateScreenFullSpecJsonImport(
      [
        {
          code: 'LOGIN',
          name: 'Login',
          modes: [{ modeCode: 'CREATE', name: 'Create' }],
          fields: [
            {
              fieldKey: 'email',
              label: 'Email',
              fieldType: 'INPUT',
              modeConfigs: [{ modeCode: 'CREATE', isVisible: true }],
              validations: [{ ruleTypeCode: 'EMAIL', ruleParamJson: { x: 1 } }],
            },
          ],
          processItems: [{ content: 'Load form' }],
          eventItems: [{ content: 'Submit', triggerActionCode: 'CLICK' }],
        },
      ],
      '11111111-1111-1111-1111-111111111111'
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items[0].projectId).toBe('11111111-1111-1111-1111-111111111111')
    expect(result.items[0].fields?.[0].validations?.[0].ruleParamJson).toBe('{"x":1}')
  })

  it('rejects missing projectId when no default is provided', () => {
    const result = validateScreenFullSpecJsonImport([{ code: 'A', name: 'A' }])
    expect(result.ok).toBe(false)
  })

  it('rejects componentFieldId on imported fields', () => {
    const result = validateScreenFullSpecJsonImport(
      [
        {
          code: 'LOGIN',
          name: 'Login',
          fields: [
            {
              fieldKey: 'email',
              label: 'Email',
              fieldType: 'INPUT',
              componentFieldId: 'a9908165-0000-0000-0000-000000000001',
            },
          ],
        },
      ],
      '11111111-1111-1111-1111-111111111111'
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((issue) => issue.path.includes('componentFieldId'))).toBe(true)
  })
})
