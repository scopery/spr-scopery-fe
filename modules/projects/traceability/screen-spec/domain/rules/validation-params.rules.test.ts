import { describe, expect, it } from 'vitest'
import {
  coerceRuleParamJson,
  parseParamSchema,
} from './validation-params.rules'

describe('validation-params.rules', () => {
  it('parses schema json and coerces integers and lists', () => {
    const schema = parseParamSchema('{"maxLength":"integer","values":"string"}')
    expect(schema).toEqual({ maxLength: 'integer', values: 'string' })
    expect(coerceRuleParamJson(schema, { maxLength: '255', values: 'a, b' })).toEqual({
      maxLength: 255,
      values: ['a', 'b'],
    })
  })

  it('returns null params when schema is null', () => {
    expect(coerceRuleParamJson(null, { maxLength: '1' })).toBeNull()
  })
})
