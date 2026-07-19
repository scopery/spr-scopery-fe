import { isProblem, getProblemCode, type ProblemDetails } from '@/shared/lib/api-types'

export interface GovernanceErrorDetails {
  action_key?: string
  blocked_reasons?: string[]
  suggested_actions?: string[]
  warnings?: string[]
  matched_policy_ids?: string[]
  matched_rule_ids?: string[]
}

export function isGovernanceDeniedError(err: unknown): boolean {
  return isProblem(err) && getProblemCode(err) === 'GOVERNANCE_ACTION_DENIED'
}

export function parseGovernanceErrorDetails(problem: ProblemDetails): GovernanceErrorDetails {
  const extended = problem as ProblemDetails & GovernanceErrorDetails
  return {
    action_key: extended.action_key,
    blocked_reasons: Array.isArray(extended.blocked_reasons) ? extended.blocked_reasons : undefined,
    suggested_actions: Array.isArray(extended.suggested_actions)
      ? extended.suggested_actions
      : undefined,
    warnings: Array.isArray(extended.warnings) ? extended.warnings : undefined,
    matched_policy_ids: Array.isArray(extended.matched_policy_ids)
      ? extended.matched_policy_ids
      : undefined,
    matched_rule_ids: Array.isArray(extended.matched_rule_ids)
      ? extended.matched_rule_ids
      : undefined,
  }
}

export function getGovernanceBlockedMessage(err: unknown): string | undefined {
  if (isProblem(err)) {
    if (getProblemCode(err) !== 'GOVERNANCE_ACTION_DENIED') return undefined
    const details = parseGovernanceErrorDetails(err.problem)
    if (details.blocked_reasons?.length) {
      return details.blocked_reasons.join(' ')
    }
    return err.problem.detail || 'This action is blocked by a governance policy.'
  }

  if (err && typeof err === 'object' && 'problem' in err) {
    return getGovernanceBlockedMessage(err as import('@/shared/lib/api-types').ApiError)
  }

  if (err && typeof err === 'object' && 'code' in err) {
    const problem = err as ProblemDetails
    if (problem.code !== 'GOVERNANCE_ACTION_DENIED') return undefined
    const details = parseGovernanceErrorDetails(problem)
    if (details.blocked_reasons?.length) {
      return details.blocked_reasons.join(' ')
    }
    return problem.detail || 'This action is blocked by a governance policy.'
  }

  return undefined
}

export function getGovernanceWarningMessages(
  governanceDecision?: {
    warnings?: string[]
    matched_rules?: Array<{ explanation?: string; policy_key?: string; rule_key?: string }>
  } | null,
  canViewRuleDetails = false
): string[] {
  if (!governanceDecision) return []
  if (governanceDecision.warnings?.length) {
    return governanceDecision.warnings
  }
  if (canViewRuleDetails && governanceDecision.matched_rules?.length) {
    return governanceDecision.matched_rules
      .map((rule) => rule.explanation)
      .filter((value): value is string => Boolean(value))
  }
  return []
}

export function getGovernanceBlockedReasons(
  governanceDecision?: {
    allowed?: boolean
    blocked_reasons?: string[]
  } | null
): string[] {
  if (!governanceDecision) return []
  if (governanceDecision.allowed !== false) return []
  return governanceDecision.blocked_reasons ?? []
}

export function isGovernancePreviewDenied(
  governanceDecision?: { allowed?: boolean } | null
): boolean {
  return governanceDecision?.allowed === false
}
