import {
  ConfidenceBand,
  MappingReviewBucket,
  SuggestionDecision,
  SuggestionReviewStatus,
  type MappingSuggestion,
} from './mapping-suggestions'
import { isStaleSuggestion } from './mapping-phase3.rules'

function hasWarnings(s: MappingSuggestion): boolean {
  return s.warnings.length > 0
}

/** Review bucket for PENDING suggestions (spec §8.1). Stale items never Ready. */
export function getMappingReviewBucket(s: MappingSuggestion): MappingReviewBucket {
  if (isStaleSuggestion(s)) {
    return MappingReviewBucket.NeedsReview
  }

  if (s.decision === SuggestionDecision.NoMatch) {
    return MappingReviewBucket.Unmatched
  }

  if (!s.targetId) {
    return MappingReviewBucket.Unmatched
  }

  if (
    s.decision === SuggestionDecision.Suggest &&
    s.confidenceBand === ConfidenceBand.High &&
    !hasWarnings(s) &&
    !s.currentTargetId
  ) {
    return MappingReviewBucket.Ready
  }

  if (s.currentTargetId && s.targetId && s.currentTargetId !== s.targetId) {
    return MappingReviewBucket.NeedsReview
  }

  if (
    s.confidenceBand === ConfidenceBand.Low &&
    s.decision !== SuggestionDecision.Suggest
  ) {
    return MappingReviewBucket.Unmatched
  }

  if (s.confidenceBand === ConfidenceBand.Low && !s.targetId) {
    return MappingReviewBucket.Unmatched
  }

  if (
    s.decision === SuggestionDecision.Ambiguous ||
    s.confidenceBand === ConfidenceBand.Medium ||
    hasWarnings(s) ||
    s.confidenceBand === ConfidenceBand.Low ||
    (s.decision === SuggestionDecision.Suggest && s.confidenceBand !== ConfidenceBand.High)
  ) {
    return MappingReviewBucket.NeedsReview
  }

  return MappingReviewBucket.NeedsReview
}

export function isPendingSuggestion(s: MappingSuggestion): boolean {
  return s.reviewStatus === SuggestionReviewStatus.Pending
}

export interface MappingBucketCounts {
  total: number
  ready: number
  needsReview: number
  unmatched: number
  hasWarning: number
  outdated: number
  remap: number
  accepted: number
  rejected: number
  pending: number
}

export function countMappingBuckets(items: MappingSuggestion[]): MappingBucketCounts {
  const counts: MappingBucketCounts = {
    total: items.length,
    ready: 0,
    needsReview: 0,
    unmatched: 0,
    hasWarning: 0,
    outdated: 0,
    remap: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
  }

  for (const s of items) {
    if (s.warnings.length > 0) counts.hasWarning += 1
    if (isStaleSuggestion(s)) counts.outdated += 1
    if (s.currentTargetId && s.targetId && s.currentTargetId !== s.targetId) {
      counts.remap += 1
    }
    if (s.reviewStatus === SuggestionReviewStatus.Accepted) {
      counts.accepted += 1
      continue
    }
    if (s.reviewStatus === SuggestionReviewStatus.Rejected) {
      counts.rejected += 1
      continue
    }
    if (s.reviewStatus === SuggestionReviewStatus.Expired) {
      continue
    }
    if (!isPendingSuggestion(s)) continue
    counts.pending += 1
    const bucket = getMappingReviewBucket(s)
    if (bucket === MappingReviewBucket.Ready) counts.ready += 1
    else if (bucket === MappingReviewBucket.Unmatched) counts.unmatched += 1
    else counts.needsReview += 1
  }

  return counts
}

export function scorePercent(score: number | null): string {
  if (score == null) return '—'
  return `${Math.round(score * 100)}%`
}
