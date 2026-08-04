import {
  ConfidenceBand,
  MappingRelationType,
  MappingReviewBucket,
  SuggestionDecision,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingSuggestion,
} from './mapping-suggestions'
import {
  getMappingReviewBucket,
  isAutoIncludeReady,
  isPendingSuggestion,
  isUnmatchedItem,
} from './mapping-review.rules'

export type MappingSourceBucket = 'READY' | 'NEEDS_REVIEW' | 'UNMATCHED'

export interface MappingSourceGroup {
  sourceId: string
  candidates: MappingSuggestion[]
  unmatchedOnly: boolean
  bucket: MappingSourceBucket
}

export function isMultiSelectRelation(type: MappingRelationTypeValue): boolean {
  return type === MappingRelationType.RequirementToFunction
}

/** AI-recommended candidates that should start checked. */
export function shouldPreselectCandidate(s: MappingSuggestion): boolean {
  if (!isPendingSuggestion(s) || !s.targetId) return false
  if (s.decision === SuggestionDecision.NoMatch) return false
  if (isAutoIncludeReady(s)) return true
  if (s.confidenceBand === ConfidenceBand.High) return true
  if (
    s.decision === SuggestionDecision.Suggest &&
    s.confidenceBand !== ConfidenceBand.Low
  ) {
    return true
  }
  return false
}

export function matchBandLabel(s: MappingSuggestion): 'Strong match' | 'Possible match' | 'Weak match' {
  if (s.confidenceBand === ConfidenceBand.High) return 'Strong match'
  if (s.confidenceBand === ConfidenceBand.Medium) return 'Possible match'
  return 'Weak match'
}

/** Display score as 0–100 integer when AI score is present; never RRF. */
export function matchScoreDisplay(s: MappingSuggestion): number | null {
  if (s.finalScore == null || !Number.isFinite(s.finalScore)) return null
  const n = s.finalScore
  if (n <= 1) return Math.round(n * 100)
  if (n <= 100) return Math.round(n)
  return null
}

export function groupSuggestionsBySource(
  items: MappingSuggestion[]
): MappingSourceGroup[] {
  const map = new Map<string, MappingSuggestion[]>()
  for (const s of items) {
    const list = map.get(s.sourceId) ?? []
    list.push(s)
    map.set(s.sourceId, list)
  }

  const groups: MappingSourceGroup[] = []
  for (const [sourceId, list] of map) {
    const pending = list.filter(isPendingSuggestion)
    const withTarget = pending.filter((s) => s.targetId)
    const unmatchedOnly =
      pending.length > 0 &&
      pending.every((s) => isUnmatchedItem(s) || !s.targetId)

    let bucket: MappingSourceBucket = 'NEEDS_REVIEW'
    if (unmatchedOnly || pending.length === 0) {
      bucket = 'UNMATCHED'
    } else if (
      withTarget.length > 0 &&
      withTarget.every((s) => getMappingReviewBucket(s) === MappingReviewBucket.Ready)
    ) {
      bucket = 'READY'
    } else if (
      withTarget.some((s) => getMappingReviewBucket(s) === MappingReviewBucket.NeedsReview)
    ) {
      bucket = 'NEEDS_REVIEW'
    } else if (withTarget.every((s) => isAutoIncludeReady(s))) {
      bucket = 'READY'
    }

    groups.push({
      sourceId,
      candidates: withTarget.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
      unmatchedOnly,
      bucket,
    })
  }

  return groups.sort((a, b) => a.sourceId.localeCompare(b.sourceId))
}
