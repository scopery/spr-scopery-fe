import { describe, expect, it } from 'vitest'
import { FunctionalItemStatus } from './functional-catalog'
import { normalizeFunctionalItemStatus } from './functional-item-status.rules'

describe('normalizeFunctionalItemStatus', () => {
  it('keeps BE statuses', () => {
    expect(normalizeFunctionalItemStatus('ACTIVE')).toBe(FunctionalItemStatus.Active)
    expect(normalizeFunctionalItemStatus('draft')).toBe(FunctionalItemStatus.Draft)
  })

  it('maps legacy FE statuses and empty values', () => {
    expect(normalizeFunctionalItemStatus('IN_REVIEW')).toBe(FunctionalItemStatus.Draft)
    expect(normalizeFunctionalItemStatus('APPROVED')).toBe(FunctionalItemStatus.Active)
    expect(normalizeFunctionalItemStatus('IMPLEMENTED')).toBe(FunctionalItemStatus.Active)
    expect(normalizeFunctionalItemStatus(null)).toBe(FunctionalItemStatus.Draft)
    expect(normalizeFunctionalItemStatus('')).toBe(FunctionalItemStatus.Draft)
  })
})
