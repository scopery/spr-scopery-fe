import { isRemapCandidate, isStaleSuggestion } from './mapping-phase3.rules'
import { isPendingSuggestion } from './mapping-review.rules'
import {
  ConfidenceBand,
  SuggestionDecision,
  type MappingSuggestion,
} from './mapping-suggestions'

/** Spec §8 HIGH margin for single-parent mappings. */
export const AUTO_MAP_SCORE_MARGIN_MIN = 0.15

export const MappingRelationSource = {
  Manual: 'MANUAL',
  AiAccepted: 'AI_ACCEPTED',
  AiAutoMapped: 'AI_AUTO_MAPPED',
} as const
export type MappingRelationSource =
  (typeof MappingRelationSource)[keyof typeof MappingRelationSource]

export function isAutoMapEligible(
  s: MappingSuggestion,
  opts?: { escalatedIds?: Set<string> }
): boolean {
  if (!isPendingSuggestion(s)) return false
  if (s.decision !== SuggestionDecision.Suggest) return false
  if (s.confidenceBand !== ConfidenceBand.High) return false
  if (!s.targetId) return false
  if (s.warnings.length > 0) return false
  if (isStaleSuggestion(s)) return false
  // Never auto-replace a confirmed parent
  if (s.currentTargetId || isRemapCandidate(s)) return false
  if (opts?.escalatedIds?.has(s.id)) return false
  if (s.scoreMargin != null && s.scoreMargin < AUTO_MAP_SCORE_MARGIN_MIN) return false
  return true
}

export function listAutoMapEligible(
  suggestions: MappingSuggestion[],
  opts?: { escalatedIds?: Set<string> }
): MappingSuggestion[] {
  return suggestions.filter((s) => isAutoMapEligible(s, opts))
}

export interface AutoMapGateCheck {
  ok: boolean
  reasons: string[]
  eligibleCount: number
}

export function checkAutoMapReady(input: {
  enabled: boolean
  gateReadyForAutoMap: boolean
  gateNotes: string[]
  eligible: MappingSuggestion[]
}): AutoMapGateCheck {
  const reasons: string[] = []
  if (!input.enabled) {
    reasons.push('Auto-map is disabled for this project (opt-in required)')
  }
  if (!input.gateReadyForAutoMap) {
    reasons.push(...input.gateNotes.filter(Boolean))
    if (reasons.length === 0 || !input.gateNotes.length) {
      reasons.push('Evaluation quality gate is not satisfied yet')
    }
  }
  if (input.eligible.length === 0) {
    reasons.push('No HIGH-confidence, conflict-free suggestions are eligible')
  }
  return {
    ok: reasons.length === 0,
    reasons,
    eligibleCount: input.eligible.length,
  }
}
