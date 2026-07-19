import type { UsagePolicyTargetType } from '../enums/usage-policy.enum'
import { UsagePolicyTargetType as Target } from '../enums/usage-policy.enum'

export function sanitizeUsageTarget(
  targetType: UsagePolicyTargetType,
  targetId: string | null | undefined
): { targetId: string | null; error: string | null } {
  if (targetType === Target.Global) {
    return { targetId: null, error: null }
  }
  const id = targetId?.trim() || null
  if (!id) {
    return { targetId: null, error: 'Target ID is required for non-GLOBAL policies' }
  }
  return { targetId: id, error: null }
}

export function hasAtLeastOneLimit(input: {
  maxRequestsPerPeriod?: number | null
  maxTokensPerPeriod?: number | null
  maxCostPerPeriod?: number | null
  maxConcurrentRequests?: number | null
  dailyBudget?: number | null
}): boolean {
  return (
    input.maxRequestsPerPeriod != null ||
    input.maxTokensPerPeriod != null ||
    input.maxCostPerPeriod != null ||
    input.maxConcurrentRequests != null ||
    input.dailyBudget != null
  )
}

export function parseOptionalDecimal(value: string): number | null | typeof NaN {
  if (!value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

export function parseOptionalInt(value: string): number | null | typeof NaN {
  if (!value.trim()) return null
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN
  return n
}
