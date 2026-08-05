import type { Requirement } from './requirements'
import {
  normalizeRequirementStatus,
  RequirementStatus,
} from './requirement-status'

/** Scope filter for requirement pickers / catalog. */
export type RequirementScopeFilter = 'all' | 'unscoped' | string

export function isRequirementArchived(r: { status?: string | null }): boolean {
  return normalizeRequirementStatus(r.status) === RequirementStatus.Archived
}

/** No scope package and no scope item membership. */
export function isRequirementUnscoped(r: Requirement): boolean {
  return !r.scopePackageId && !r.scopeItemId
}

export function isRequirementInScopePackage(
  r: Requirement,
  scopePackageId: string
): boolean {
  return r.scopePackageId === scopePackageId
}

export function matchesRequirementScopeFilter(
  r: Requirement,
  filter: RequirementScopeFilter
): boolean {
  if (filter === 'all') return true
  if (filter === 'unscoped') return isRequirementUnscoped(r)
  return isRequirementInScopePackage(r, filter)
}

/**
 * Eligible to link into a scope package:
 * active + not already in any scope.
 */
export function isRequirementLinkableToScope(r: Requirement): boolean {
  return !isRequirementArchived(r) && isRequirementUnscoped(r)
}
