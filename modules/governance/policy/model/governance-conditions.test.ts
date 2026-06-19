import { describe, it, expect } from 'vitest'
import {
  createEmptyConditionGroup,
  parseConditionsJson,
  summarizeConditionGroup,
  validateConditionGroup,
} from './governance-conditions'

describe('governanceConditions', () => {
  it('validates a valid all group', () => {
    const group = {
      all: [{ field: 'readiness_status', operator: 'not_equals', value: 'blocked' }],
    }
    expect(validateConditionGroup(group)).toEqual([])
  })

  it('rejects unknown field', () => {
    const group = {
      all: [{ field: 'secret_field', operator: 'equals', value: 'x' }],
    }
    expect(validateConditionGroup(group).length).toBeGreaterThan(0)
  })

  it('rejects empty group', () => {
    expect(validateConditionGroup({ all: [] }).length).toBeGreaterThan(0)
  })

  it('rejects equals operator without value', () => {
    const errors = validateConditionGroup({
      all: [{ field: 'readiness_status', operator: 'equals' }],
    })
    expect(errors.some((e) => e.includes('Value is required'))).toBe(true)
  })

  it('parses valid JSON', () => {
    const result = parseConditionsJson(
      JSON.stringify({ all: [{ field: 'workflow_status', operator: 'equals', value: 'draft' }] })
    )
    expect(result.errors).toEqual([])
    expect(result.group?.all).toHaveLength(1)
  })

  it('summarizes condition group', () => {
    const summary = summarizeConditionGroup({
      all: [{ field: 'readiness_status', operator: 'not_equals', value: 'blocked' }],
    })
    expect(summary).toContain('readiness_status')
  })

  it('creates empty all group', () => {
    const group = createEmptyConditionGroup('all')
    expect(group.all?.length).toBe(1)
  })
})
