/** Shared priority display helpers for requirement badges. */

export type RequirementPriorityTone = 'error' | 'warning' | 'neutral' | 'info' | 'default'

export type RequirementPriorityBadgeProps = {
  variant: 'solid' | 'soft'
  tone: RequirementPriorityTone
  className?: string
}

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

/**
 * Badge props for priority chips.
 * High = solid error · Medium = solid info (former Low blue) · Low = amber soft.
 */
export function requirementPriorityBadgeProps(
  priority: string | null | undefined
): RequirementPriorityBadgeProps {
  switch ((priority ?? '').toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
    case 'P0':
    case 'P1':
      return { variant: 'solid', tone: 'error' }
    case 'MEDIUM':
    case 'P2':
      return { variant: 'solid', tone: 'info' }
    case 'LOW':
    case 'P3':
      return {
        variant: 'soft',
        tone: 'default',
        className: 'bg-amber-100 text-amber-700',
      }
    default:
      return { variant: 'soft', tone: 'neutral' }
  }
}

export function requirementPriorityTone(
  priority: string | null | undefined
): RequirementPriorityTone {
  return requirementPriorityBadgeProps(priority).tone
}
