'use client'

import { Badge } from '@/shared/ui'
import type { ClarityLabel } from '../model/clarity'
import { cn } from '@/utils/cn'

const LABEL_TONE: Record<ClarityLabel, 'error' | 'warning' | 'success' | 'info'> = {
  unclear: 'error',
  partially_clear: 'warning',
  clear: 'info',
  very_clear: 'success',
}

interface ClarityBadgeProps {
  label: ClarityLabel
  score: number
  onClick?: () => void
  className?: string
}

/** Format score as 0.00 */
function formatScore(score: number): string {
  return Number.isFinite(score) ? score.toFixed(2) : '—'
}

/** e.g. partially_clear → Partially clear */
function formatClarityLabel(label: string): string {
  return label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ClarityBadge({ label, score, onClick, className }: ClarityBadgeProps) {
  const tone = LABEL_TONE[label] ?? 'neutral'
  const displayLabel = formatClarityLabel(label)
  const formatted = formatScore(score)

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'focus:ring-primary/40 inline-flex items-center gap-1 rounded focus:outline-none focus:ring-2',
          className
        )}
        aria-label={`Clarity: ${displayLabel} ${formatted}. Click to view details.`}
      >
        <Badge variant="soft" tone={tone} size="sm">
          {displayLabel} {formatted}
        </Badge>
      </button>
    )
  }

  return (
    <Badge variant="soft" tone={tone} size="sm" className={className}>
      {displayLabel} {formatted}
    </Badge>
  )
}
