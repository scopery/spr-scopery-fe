import {
  MappingRelationType,
  SuggestionReviewStatus,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingSuggestion,
} from './mapping-suggestions'

const STALE_WARNING_TOKENS = ['STALE', 'OUTDATED', 'SOURCE_CHANGED', 'TARGET_CHANGED']

export function isExpiredStatus(s: MappingSuggestion): boolean {
  return s.reviewStatus === SuggestionReviewStatus.Expired
}

/** True when suggestion is outdated and must not be bulk-applied. */
export function isStaleSuggestion(s: MappingSuggestion): boolean {
  if (s.stale) return true
  if (isExpiredStatus(s)) return true
  return s.warnings.some((w) =>
    STALE_WARNING_TOKENS.some((t) => w.toUpperCase().includes(t))
  )
}

/**
 * Mark stale when live entity version advanced past the version captured at generate time.
 */
export function enrichSuggestionFreshness(
  s: MappingSuggestion,
  liveSourceVersion: number | null | undefined,
  liveTargetVersion: number | null | undefined
): MappingSuggestion {
  let stale = isStaleSuggestion(s)
  if (
    s.sourceVersion != null &&
    liveSourceVersion != null &&
    liveSourceVersion > s.sourceVersion
  ) {
    stale = true
  }
  if (
    s.targetId &&
    s.targetVersion != null &&
    liveTargetVersion != null &&
    liveTargetVersion > s.targetVersion
  ) {
    stale = true
  }
  return stale ? { ...s, stale: true } : { ...s, stale: false }
}

export function isRemapCandidate(s: MappingSuggestion): boolean {
  if (!s.targetId || !s.currentTargetId) return false
  return s.currentTargetId !== s.targetId
}

export function supportsSingleParentRemap(type: MappingRelationTypeValue): boolean {
  return (
    type === MappingRelationType.FunctionToUseCase ||
    type === MappingRelationType.UseCaseToTestCase
  )
}

export interface MappingUndoEntry {
  id: string
  relationType: MappingRelationTypeValue
  sourceId: string
  /** Parent before apply (null if was unmapped). */
  previousTargetId: string | null
  /** Parent written by apply. */
  appliedTargetId: string
  suggestionId?: string
  at: string
}

export function buildUndoEntriesFromApply(
  relationType: MappingRelationTypeValue,
  applied: Array<{
    suggestionId: string
    sourceId: string
    appliedTargetId: string
    previousTargetId: string | null
  }>
): MappingUndoEntry[] {
  const at = new Date().toISOString()
  return applied.map((row, i) => ({
    id: `${row.suggestionId}:${at}:${i}`,
    relationType,
    sourceId: row.sourceId,
    previousTargetId: row.previousTargetId,
    appliedTargetId: row.appliedTargetId,
    suggestionId: row.suggestionId,
    at,
  }))
}
