import { FunctionalItemStatus } from './functional-catalog'

/** BE FunctionalItemStatus: DRAFT | ACTIVE | DEPRECATED | ARCHIVED */
export function normalizeFunctionalItemStatus(
  status: string | null | undefined
): FunctionalItemStatus {
  const raw = (status ?? '').trim().toUpperCase()
  switch (raw) {
    case FunctionalItemStatus.Draft:
    case FunctionalItemStatus.Active:
    case FunctionalItemStatus.Deprecated:
    case FunctionalItemStatus.Archived:
      return raw
    case 'IN_REVIEW':
      return FunctionalItemStatus.Draft
    case 'APPROVED':
    case 'IMPLEMENTED':
      return FunctionalItemStatus.Active
    default:
      return FunctionalItemStatus.Draft
  }
}
