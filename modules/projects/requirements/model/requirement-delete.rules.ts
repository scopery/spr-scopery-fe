import type { Requirement } from './requirements'

/** Requirement is linked to a Functional Catalog function (FR). */
export function isRequirementLinkedToFunction(requirement: Requirement): boolean {
  return Boolean(requirement.functionalItemId?.trim())
}

/**
 * Hard-delete is allowed only when the requirement is not linked to a function.
 * Unlink the FR first, then delete.
 */
export function canDeleteRequirement(requirement: Requirement): boolean {
  return !isRequirementLinkedToFunction(requirement)
}

export const RequirementDeleteMessages = {
  LINKED_TO_FUNCTION:
    'This requirement is linked to a function. Unlink it from the function first, then delete.',
} as const
