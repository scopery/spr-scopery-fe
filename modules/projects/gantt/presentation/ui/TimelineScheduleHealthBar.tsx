'use client'

import { Badge } from '@/shared/ui'
import { cn } from '@/utils/cn'

type Props = {
  itemCount: number
  scheduledCount: number
  unscheduledCount: number
  issueCount: number
  atRiskCount?: number
  onOpenScheduled?: () => void
  onOpenUnscheduled: () => void
  onOpenIssues: () => void
  onOpenAtRisk?: () => void
  className?: string
}

function StatBadge({
  label,
  count,
  tone,
  variant = 'solid',
  onClick,
  disabled,
}: {
  label: string
  count: number
  tone: 'neutral' | 'success' | 'warning' | 'error' | 'info'
  variant?: 'soft' | 'solid' | 'outline'
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center',
        onClick && !disabled && 'cursor-pointer hover:opacity-80',
        (!onClick || disabled) && 'cursor-default'
      )}
    >
      <Badge tone={tone} size="sm" variant={variant}>
        {count} {label}
      </Badge>
    </button>
  )
}

/**
 * Compact schedule stats — sits beside the Timeline title (not a full-width bar).
 */
export function TimelineScheduleHealthBar({
  itemCount,
  scheduledCount,
  unscheduledCount,
  issueCount,
  atRiskCount = 0,
  onOpenScheduled,
  onOpenUnscheduled,
  onOpenIssues,
  onOpenAtRisk,
  className,
}: Props) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      aria-label="Schedule summary"
    >
      <Badge tone="neutral" size="sm" variant="solid">
        {itemCount} tasks
      </Badge>
      <StatBadge
        label="scheduled"
        count={scheduledCount}
        tone="info"
        variant="solid"
        onClick={onOpenScheduled}
      />
      <StatBadge
        label="unscheduled"
        count={unscheduledCount}
        tone={unscheduledCount > 0 ? 'warning' : 'neutral'}
        variant="solid"
        onClick={onOpenUnscheduled}
      />
      <StatBadge
        label="issues"
        count={issueCount}
        tone={issueCount > 0 ? 'error' : 'neutral'}
        variant="solid"
        onClick={onOpenIssues}
      />
      <StatBadge
        label="at risk"
        count={atRiskCount}
        tone={atRiskCount > 0 ? 'error' : 'neutral'}
        variant="solid"
        onClick={onOpenAtRisk}
        disabled={!onOpenAtRisk}
      />
    </div>
  )
}
