import { describe, expect, it } from 'vitest'
import { checkAutoMapReady, isAutoMapEligible } from './mapping-automap.rules'
import type { MappingSuggestion } from './mapping-suggestions'

function sug(partial: Partial<MappingSuggestion> & Pick<MappingSuggestion, 'id'>): MappingSuggestion {
  return {
    runId: 'run-1',
    sourceType: 'USE_CASE',
    sourceId: `src-${partial.id}`,
    sourceVersion: 1,
    targetType: 'FUNCTION',
    targetId: `tgt-${partial.id}`,
    targetVersion: 1,
    relationType: 'FUNCTION_TO_USE_CASE',
    rank: 1,
    finalScore: 0.95,
    scoreMargin: 0.2,
    confidenceBand: 'HIGH',
    decision: 'SUGGEST',
    reasonCodes: [],
    evidence: [],
    warnings: [],
    reviewStatus: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: null,
    ...partial,
  }
}

describe('isAutoMapEligible', () => {
  it('allows clean HIGH suggest', () => {
    expect(isAutoMapEligible(sug({ id: '1' }))).toBe(true)
  })

  it('rejects remaps, stale, warnings, low margin, escalated', () => {
    expect(isAutoMapEligible(sug({ id: '1', currentTargetId: 'old' }))).toBe(false)
    expect(isAutoMapEligible(sug({ id: '2', stale: true }))).toBe(false)
    expect(isAutoMapEligible(sug({ id: '3', warnings: ['SOFT'] }))).toBe(false)
    expect(isAutoMapEligible(sug({ id: '4', scoreMargin: 0.05 }))).toBe(false)
    expect(isAutoMapEligible(sug({ id: '5' }), { escalatedIds: new Set(['5']) })).toBe(false)
    expect(isAutoMapEligible(sug({ id: '6', confidenceBand: 'MEDIUM' }))).toBe(false)
  })
})

describe('checkAutoMapReady', () => {
  it('requires opt-in, gate, and eligible items', () => {
    const eligible = [sug({ id: '1' })]
    expect(
      checkAutoMapReady({
        enabled: false,
        gateReadyForAutoMap: true,
        gateNotes: [],
        eligible,
      }).ok
    ).toBe(false)
    expect(
      checkAutoMapReady({
        enabled: true,
        gateReadyForAutoMap: false,
        gateNotes: ['Need more HIGH reviews'],
        eligible,
      }).ok
    ).toBe(false)
    expect(
      checkAutoMapReady({
        enabled: true,
        gateReadyForAutoMap: true,
        gateNotes: ['ok'],
        eligible: [],
      }).ok
    ).toBe(false)
    expect(
      checkAutoMapReady({
        enabled: true,
        gateReadyForAutoMap: true,
        gateNotes: ['ok'],
        eligible,
      }).ok
    ).toBe(true)
  })
})
