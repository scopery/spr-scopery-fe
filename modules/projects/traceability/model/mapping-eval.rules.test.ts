import { describe, expect, it } from 'vitest'
import { computeMappingEvalMetrics, formatPct } from './mapping-eval.rules'
import type { MappingRun, MappingSuggestion } from './mapping-suggestions'

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
    finalScore: 0.9,
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

describe('computeMappingEvalMetrics', () => {
  it('computes acceptance and HIGH precision', () => {
    const items = [
      sug({ id: '1', reviewStatus: 'ACCEPTED', confidenceBand: 'HIGH' }),
      sug({ id: '2', reviewStatus: 'ACCEPTED', confidenceBand: 'HIGH' }),
      sug({ id: '3', reviewStatus: 'REJECTED', confidenceBand: 'HIGH' }),
      sug({ id: '4', reviewStatus: 'REJECTED', confidenceBand: 'MEDIUM' }),
      sug({ id: '5', decision: 'NO_MATCH', targetId: null, confidenceBand: 'LOW' }),
    ]
    const run: MappingRun = {
      id: 'run-1',
      projectId: 'p1',
      relationType: 'FUNCTION_TO_USE_CASE',
      scope: 'UNMAPPED',
      status: 'COMPLETED',
      sourceCount: 5,
      suggestionCount: 5,
      tokenUsageJson: '{"inputTokens":100,"outputTokens":50}',
      promptKey: 'TRACE_MAP_UC_FUNCTION_V1',
      promptVersion: 1,
      candidateLimit: 5,
      startedAt: null,
      completedAt: null,
      createdAt: null,
    }
    const m = computeMappingEvalMetrics(items, run)
    expect(m.acceptedCount).toBe(2)
    expect(m.rejectedCount).toBe(2)
    expect(formatPct(m.acceptanceRate)).toBe('50%')
    expect(formatPct(m.highPrecision)).toBe('67%')
    expect(m.tokens?.inputTokens).toBe(100)
    expect(m.noMatchCount).toBe(1)
  })
})
