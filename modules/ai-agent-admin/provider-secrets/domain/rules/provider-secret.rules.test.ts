import { describe, expect, it } from 'vitest'
import {
  assertNoRawSecretInRecord,
  isSecretValueWithinLimit,
} from './provider-secret.rules'

describe('provider-secret.rules', () => {
  it('rejects records that still carry raw secretValue', () => {
    expect(assertNoRawSecretInRecord({ id: '1', maskedValue: '****' })).toBe(true)
    expect(assertNoRawSecretInRecord({ id: '1', secretValue: 'sk-live' })).toBe(false)
  })

  it('enforces non-empty secret within size limit', () => {
    expect(isSecretValueWithinLimit('abc')).toBe(true)
    expect(isSecretValueWithinLimit('')).toBe(false)
    expect(isSecretValueWithinLimit('x'.repeat(5001))).toBe(false)
  })
})
