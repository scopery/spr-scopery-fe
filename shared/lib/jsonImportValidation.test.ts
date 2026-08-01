import { describe, expect, it } from 'vitest'
import {
  formatJsonImportIssues,
  isUuid,
  parseJsonImportText,
  requireEnum,
  type JsonImportIssue,
} from './jsonImportValidation'
import { validateTestCaseJsonImport } from '@/modules/quality/presentation/model/test-case-json-import.validation'
import { validateUseCaseShellJsonImport } from '@/modules/projects/traceability/model/use-case-json-import.validation'

describe('parseJsonImportText', () => {
  it('rejects empty and non-json', () => {
    expect(parseJsonImportText('').ok).toBe(false)
    expect(parseJsonImportText('code\ttitle').ok).toBe(false)
  })

  it('accepts items wrapper and bare array', () => {
    expect(parseJsonImportText('{"items":[{"a":1}]}').items).toHaveLength(1)
    expect(parseJsonImportText('[{"a":1},{"b":2}]').items).toHaveLength(2)
  })

  it('rejects non-object items', () => {
    const result = parseJsonImportText('{"items":[1,"x"]}')
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path.includes('items['))).toBe(true)
  })
})

describe('helpers', () => {
  it('validates uuid', () => {
    expect(isUuid('00000000-0000-4000-8000-000000000001')).toBe(true)
    expect(isUuid('not-a-uuid')).toBe(false)
  })

  it('requireEnum rejects invalid values', () => {
    const issues: JsonImportIssue[] = []
    const value = requireEnum(
      { type: 'NOPE' },
      'type',
      ['FUNCTIONAL', 'INTEGRATION'],
      'items[0].type',
      issues
    )
    expect(value).toBeNull()
    expect(issues[0]?.message).toContain('FUNCTIONAL')
  })

  it('formats issues', () => {
    expect(
      formatJsonImportIssues([{ path: 'items[0].title', message: 'required' }])
    ).toContain('items[0].title')
  })
})

describe('validateTestCaseJsonImport', () => {
  it('requires title', () => {
    const result = validateTestCaseJsonImport([{ title: '' }])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.path.endsWith('title'))).toBe(true)
  })

  it('rejects link IDs and unknown fields', () => {
    const result = validateTestCaseJsonImport([
      {
        title: 'Login',
        useCaseId: '00000000-0000-4000-8000-000000000001',
        typoField: true,
        type: 'NOT_REAL',
        steps: [{ action: '' }],
      },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.path.endsWith('useCaseId'))).toBe(true)
  })

  it('accepts a full valid item with steps', () => {
    const result = validateTestCaseJsonImport([
      {
        title: 'Login succeeds',
        code: 'TC-1',
        type: 'FUNCTIONAL',
        priority: 'HIGH',
        steps: [{ action: 'Open login', expectedResult: 'Form shown' }],
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items[0].steps).toHaveLength(1)
  })
})

describe('validateUseCaseShellJsonImport', () => {
  it('flags duplicate keys in batch', () => {
    const result = validateUseCaseShellJsonImport([
      { key: 'UC-1', name: 'A' },
      { key: 'UC-1', name: 'B' },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.message.includes('Duplicate'))).toBe(true)
  })

  it('rejects primaryFunctionId as unknown', () => {
    const result = validateUseCaseShellJsonImport([
      {
        key: 'UC-1',
        name: 'A',
        primaryFunctionId: '00000000-0000-4000-8000-000000000001',
      },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.path.endsWith('primaryFunctionId'))).toBe(true)
  })

  it('accepts nested conditions/flows/rules/criteria on the same item', () => {
    const result = validateUseCaseShellJsonImport([
      {
        key: 'UC-1',
        name: 'Login',
        conditions: [{ conditionType: 'PRECONDITION', content: 'Account exists' }],
        flows: [
          {
            flowType: 'MAIN',
            steps: [{ stepType: 'USER_ACTION', content: 'Enter credentials' }],
          },
        ],
        businessRules: [{ ruleCode: 'BR-1', description: 'Password policy' }],
        acceptanceCriteria: [{ title: 'Login succeeds' }],
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items[0].shell.key).toBe('UC-1')
    expect(result.items[0].nested?.conditions).toHaveLength(1)
    expect(result.items[0].nested?.flows).toHaveLength(1)
    expect(result.items[0].nested?.businessRules).toHaveLength(1)
    expect(result.items[0].nested?.acceptanceCriteria).toHaveLength(1)
  })
})
