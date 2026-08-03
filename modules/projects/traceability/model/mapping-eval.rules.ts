import { isRemapCandidate, isStaleSuggestion } from './mapping-phase3.rules'
import {
  ConfidenceBand,
  SuggestionDecision,
  SuggestionReviewStatus,
  parseMappingTokenUsage,
  type MappingRun,
  type MappingSuggestion,
  type MappingTokenUsage,
} from './mapping-suggestions'

/** Expected accept rates used for confidence calibration display (spec §8). */
export const CONFIDENCE_CALIBRATION_TARGETS = {
  HIGH: 0.88,
  MEDIUM: 0.55,
  LOW: 0.25,
} as const

export interface BandStats {
  band: string
  total: number
  accepted: number
  rejected: number
  pending: number
  acceptRate: number | null
  targetRate: number
  calibrated: boolean | null
}

export interface MappingEvalMetrics {
  suggestionCount: number
  reviewedCount: number
  acceptedCount: number
  rejectedCount: number
  pendingCount: number
  noMatchCount: number
  ambiguousCount: number
  suggestCount: number
  staleCount: number
  remapCount: number
  /** Accepted / (Accepted + Rejected) among reviewed */
  acceptanceRate: number | null
  /** Accepted among SUGGEST decisions that were reviewed */
  topSuggestAcceptRate: number | null
  bulkReadyAcceptShare: number | null
  highPrecision: number | null
  mediumPrecision: number | null
  lowPrecision: number | null
  noMatchShare: number | null
  staleShare: number | null
  remapShare: number | null
  bands: BandStats[]
  tokens: MappingTokenUsage | null
  tokensPerAccepted: number | null
  promptKey: string | null
  promptVersion: number | null
  candidateLimit: number | null
  sourceCount: number | null
  /** Client-measured average review time (ms) when provided */
  avgReviewMs: number | null
  gateReadyForAutoMap: boolean
  gateNotes: string[]
}

function rate(num: number, den: number): number | null {
  if (den <= 0) return null
  return num / den
}

function bandOf(s: MappingSuggestion): string {
  return (s.confidenceBand ?? 'UNKNOWN').toUpperCase()
}

export function computeMappingEvalMetrics(
  suggestions: MappingSuggestion[],
  run: MappingRun | null,
  opts?: { avgReviewMs?: number | null }
): MappingEvalMetrics {
  const accepted = suggestions.filter((s) => s.reviewStatus === SuggestionReviewStatus.Accepted)
  const rejected = suggestions.filter((s) => s.reviewStatus === SuggestionReviewStatus.Rejected)
  const pending = suggestions.filter((s) => s.reviewStatus === SuggestionReviewStatus.Pending)
  const reviewed = accepted.length + rejected.length

  const noMatch = suggestions.filter((s) => s.decision === SuggestionDecision.NoMatch)
  const ambiguous = suggestions.filter((s) => s.decision === SuggestionDecision.Ambiguous)
  const suggest = suggestions.filter((s) => s.decision === SuggestionDecision.Suggest)
  const stale = suggestions.filter(isStaleSuggestion)
  const remap = suggestions.filter(isRemapCandidate)

  const reviewedSuggest = suggest.filter(
    (s) =>
      s.reviewStatus === SuggestionReviewStatus.Accepted ||
      s.reviewStatus === SuggestionReviewStatus.Rejected
  )
  const acceptedSuggest = reviewedSuggest.filter(
    (s) => s.reviewStatus === SuggestionReviewStatus.Accepted
  )

  const high = suggestions.filter((s) => bandOf(s) === ConfidenceBand.High)
  const medium = suggestions.filter((s) => bandOf(s) === ConfidenceBand.Medium)
  const low = suggestions.filter((s) => bandOf(s) === ConfidenceBand.Low)

  const bandPrecision = (items: MappingSuggestion[]) => {
    const rev = items.filter(
      (s) =>
        s.reviewStatus === SuggestionReviewStatus.Accepted ||
        s.reviewStatus === SuggestionReviewStatus.Rejected
    )
    const acc = rev.filter((s) => s.reviewStatus === SuggestionReviewStatus.Accepted)
    return rate(acc.length, rev.length)
  }

  const bands: BandStats[] = (
    [ConfidenceBand.High, ConfidenceBand.Medium, ConfidenceBand.Low, 'UNKNOWN'] as const
  ).map((band) => {
    const items = suggestions.filter((s) => bandOf(s) === band)
    const acc = items.filter((s) => s.reviewStatus === SuggestionReviewStatus.Accepted).length
    const rej = items.filter((s) => s.reviewStatus === SuggestionReviewStatus.Rejected).length
    const pen = items.filter((s) => s.reviewStatus === SuggestionReviewStatus.Pending).length
    const acceptRate = rate(acc, acc + rej)
    const targetRate =
      band === ConfidenceBand.High
        ? CONFIDENCE_CALIBRATION_TARGETS.HIGH
        : band === ConfidenceBand.Medium
          ? CONFIDENCE_CALIBRATION_TARGETS.MEDIUM
          : band === ConfidenceBand.Low
            ? CONFIDENCE_CALIBRATION_TARGETS.LOW
            : 0
    const calibrated =
      acceptRate == null || items.length === 0
        ? null
        : band === 'UNKNOWN'
          ? null
          : acceptRate >= targetRate * 0.9
    return {
      band,
      total: items.length,
      accepted: acc,
      rejected: rej,
      pending: pen,
      acceptRate,
      targetRate,
      calibrated,
    }
  })

  const tokens = parseMappingTokenUsage(run?.tokenUsageJson)
  const totalTokens = tokens ? tokens.inputTokens + tokens.outputTokens : null
  const tokensPerAccepted =
    totalTokens != null && accepted.length > 0 ? totalTokens / accepted.length : null

  const highPrecision = bandPrecision(high)
  const mediumPrecision = bandPrecision(medium)
  const lowPrecision = bandPrecision(low)

  const gateNotes: string[] = []
  let gateReadyForAutoMap = true
  if (highPrecision == null || high.length < 5) {
    gateReadyForAutoMap = false
    gateNotes.push('Need ≥5 reviewed HIGH suggestions to assess auto-map gate')
  } else if (highPrecision < CONFIDENCE_CALIBRATION_TARGETS.HIGH) {
    gateReadyForAutoMap = false
    gateNotes.push(
      `HIGH precision ${(highPrecision * 100).toFixed(0)}% below ${(CONFIDENCE_CALIBRATION_TARGETS.HIGH * 100).toFixed(0)}% target`
    )
  }
  if (stale.length > 0 && rate(stale.length, suggestions.length)! > 0.15) {
    gateReadyForAutoMap = false
    gateNotes.push('Stale suggestion rate above 15%')
  }
  if (gateReadyForAutoMap) {
    gateNotes.push('HIGH precision meets target on current run sample')
  }

  const readyLike = high.filter(
    (s) => s.decision === SuggestionDecision.Suggest && !isStaleSuggestion(s) && !s.warnings.length
  )
  const readyAccepted = readyLike.filter(
    (s) => s.reviewStatus === SuggestionReviewStatus.Accepted
  )

  return {
    suggestionCount: suggestions.length,
    reviewedCount: reviewed,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    pendingCount: pending.length,
    noMatchCount: noMatch.length,
    ambiguousCount: ambiguous.length,
    suggestCount: suggest.length,
    staleCount: stale.length,
    remapCount: remap.length,
    acceptanceRate: rate(accepted.length, reviewed),
    topSuggestAcceptRate: rate(acceptedSuggest.length, reviewedSuggest.length),
    bulkReadyAcceptShare: rate(readyAccepted.length, readyLike.length),
    highPrecision,
    mediumPrecision,
    lowPrecision,
    noMatchShare: rate(noMatch.length, suggestions.length),
    staleShare: rate(stale.length, suggestions.length),
    remapShare: rate(remap.length, suggestions.length),
    bands: bands.filter((b) => b.total > 0 || b.band !== 'UNKNOWN'),
    tokens,
    tokensPerAccepted,
    promptKey: run?.promptKey ?? null,
    promptVersion: run?.promptVersion ?? null,
    candidateLimit: run?.candidateLimit ?? null,
    sourceCount: run?.sourceCount ?? null,
    avgReviewMs: opts?.avgReviewMs ?? null,
    gateReadyForAutoMap,
    gateNotes,
  }
}

export function formatPct(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export function formatMs(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  if (value < 1000) return `${Math.round(value)} ms`
  return `${(value / 1000).toFixed(1)} s`
}
