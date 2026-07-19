import { RateCardEntityStatus, RateCardStatus, RateCardVersionStatus } from '../enums/rate-card.enum'
import type { CostRole } from '../model/cost-role'
import type { InflationPolicy } from '../model/inflation-policy'
import type { MemberCostRole } from '../model/member-cost-role'
import type { RateCard } from '../model/rate-card'
import type { RateCardVersion } from '../model/rate-card-version'

export function isCostRoleActive(role: CostRole): boolean {
  return role.status === RateCardEntityStatus.Active
}

export function isCostRoleArchived(role: CostRole): boolean {
  return role.status === RateCardEntityStatus.Archived
}

export function isInflationPolicyActive(policy: InflationPolicy): boolean {
  return policy.status === RateCardEntityStatus.Active
}

export function isInflationPolicyArchived(policy: InflationPolicy): boolean {
  return policy.status === RateCardEntityStatus.Archived
}

export function isMemberCostRoleActive(assignment: MemberCostRole): boolean {
  return assignment.status === RateCardEntityStatus.Active
}

export function isMemberCostRoleArchived(assignment: MemberCostRole): boolean {
  return assignment.status === RateCardEntityStatus.Archived
}

export function isRateCardDraft(card: RateCard): boolean {
  return card.status === RateCardStatus.Draft
}

export function isRateCardArchived(card: RateCard): boolean {
  return card.status === RateCardStatus.Archived
}

export function canArchiveRateCard(card: RateCard): boolean {
  return card.status !== RateCardStatus.Archived
}

export function isVersionDraft(version: RateCardVersion): boolean {
  return version.status === RateCardVersionStatus.Draft
}

export function isVersionPublished(version: RateCardVersion): boolean {
  return version.status === RateCardVersionStatus.Published
}

export function isVersionArchived(version: RateCardVersion): boolean {
  return version.status === RateCardVersionStatus.Archived
}

/** Lines can only be added/edited/removed while the version is still in DRAFT. */
export function canEditVersionLines(version: RateCardVersion): boolean {
  return isVersionDraft(version)
}

export function canPublishVersion(version: RateCardVersion): boolean {
  return isVersionDraft(version)
}

export function canArchiveVersion(version: RateCardVersion): boolean {
  return !isVersionArchived(version)
}

export function canDuplicateVersion(version: RateCardVersion): boolean {
  return !isVersionArchived(version)
}
