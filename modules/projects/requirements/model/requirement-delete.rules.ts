import type { Requirement } from './requirements'

/** Requirement is linked to a Functional Catalog function (FR). */
export function isRequirementLinkedToFunction(requirement: Requirement): boolean {
  return Boolean(requirement.functionalItemId?.trim())
}

/**
 * Archive (soft-delete) is allowed only when the requirement is not linked to a function.
 * Unlink the FR first, then archive.
 */
export function canArchiveRequirement(requirement: Requirement): boolean {
  return !isRequirementLinkedToFunction(requirement)
}

/** @deprecated Use canArchiveRequirement — BE has archive, not hard delete. */
export const canDeleteRequirement = canArchiveRequirement

export const RequirementDeleteMessages = {
  LINKED_TO_FUNCTION:
    'This requirement is linked to a function. Unlink it from the function first, then archive.',
} as const
