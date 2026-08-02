'use client'

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

const STAT_PILL =
  'inline-flex shrink-0 items-center rounded-none bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-900'

function StatBadge({
  label,
  count,
  onClick,
  disabled,
}: {
  label: string
  count: number
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={cn(
        STAT_PILL,
        onClick && !disabled && 'cursor-pointer hover:bg-neutral-200',
        (!onClick || disabled) && 'cursor-default'
      )}
    >
      {count} {label}
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
      <span className={STAT_PILL}>
        {itemCount} tasks
      </span>
      <StatBadge label="scheduled" count={scheduledCount} onClick={onOpenScheduled} />
      <StatBadge label="unscheduled" count={unscheduledCount} onClick={onOpenUnscheduled} />
      <StatBadge label="issues" count={issueCount} onClick={onOpenIssues} />
      <StatBadge
        label="at risk"
        count={atRiskCount}
        onClick={onOpenAtRisk}
        disabled={!onOpenAtRisk}
      />
    </div>
  )
}
