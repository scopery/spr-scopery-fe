import type { BadgeTone } from '@/shared/ui'
import type { PortfolioHealth } from '../../domain/rules/portfolio.rules'
import type { PortfolioMetricFilter } from '../../domain/rules/portfolio.rules'

/**
 * Distinct solid badge tones for portfolio statuses.
 * Avoid stacking everything on `warning` (orange).
 *
 * On track     → success (green)
 * At risk      → warning (orange)
 * Blocked      → error (red)
 * Unassigned   → progress (navy)
 * Starting soon→ info (blue)
 * HIGH         → error
 * MEDIUM       → secondary / progress (navy-blue family)
 */
export function portfolioMetricTone(key: PortfolioMetricFilter): BadgeTone {
  switch (key) {
    case 'on_track':
      return 'success'
    case 'at_risk':
      return 'warning'
    case 'blocked':
      return 'error'
    case 'unassigned':
      return 'progress'
    case 'starting_soon':
      return 'info'
    default:
      return 'neutral'
  }
}

export function portfolioHealthTone(health: PortfolioHealth): BadgeTone {
  switch (health) {
    case 'blocked':
      return 'error'
    case 'at_risk':
      return 'warning'
    case 'on_track':
      return 'success'
    default:
      return 'neutral'
  }
}

export function portfolioSeverityTone(severity: 'HIGH' | 'MEDIUM' | string): BadgeTone {
  if (severity === 'HIGH') return 'error'
  if (severity === 'MEDIUM') return 'secondary'
  return 'neutral'
}

export function portfolioFollowUpTone(label: string): BadgeTone {
  const lower = label.toLowerCase()
  if (lower.includes('block')) return 'error'
  if (lower.includes('unassigned')) return 'neutral'
  if (lower.includes('owner')) return 'progress'
  if (lower.includes('ending soon')) return 'error'
  if (lower.includes('start') || lower.includes('soon')) return 'info'
  if (lower.includes('end') || lower.includes('delay') || lower.includes('risk')) return 'warning'
  return 'neutral'
}
