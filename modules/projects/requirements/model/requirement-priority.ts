/** Shared priority display helpers for requirement badges. */

export type RequirementPriorityTone = 'error' | 'warning' | 'neutral' | 'info'

export function requirementPriorityLabel(priority: string | null | undefined): string {
  switch ((priority ?? '').toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
    case 'P0':
    case 'P1':
      return 'High'
    case 'MEDIUM':
    case 'P2':
      return 'Medium'
    case 'LOW':
    case 'P3':
      return 'Low'
    default:
      return priority?.trim() ? priority : '—'
  }
}

/** Solid badge tone — colored bg + white text via Badge `variant="solid"`. */
export function requirementPriorityTone(
  priority: string | null | undefined
): RequirementPriorityTone {
  switch ((priority ?? '').toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
    case 'P0':
    case 'P1':
      return 'error'
    case 'MEDIUM':
    case 'P2':
      return 'warning'
    case 'LOW':
    case 'P3':
      return 'info'
    default:
      return 'neutral'
  }
}
