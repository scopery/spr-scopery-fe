import React from 'react'
import { cn } from '@/utils'
import { Typography } from '../Typography'
import type { ProgressProps } from './Progress.types'

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const progressTones = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
}

/**
 * Progress component - Progress indicator
 *
 * @example
 * ```tsx
 * <Progress value={50} />
 * <Progress value={75} tone="success" showValue />
 * <Progress indeterminate />
 * ```
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      size = 'md',
      tone = 'primary',
      showValue = false,
      indeterminate = false,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showValue && !indeterminate && (
          <div className="mb-1 flex items-center justify-between">
            <Typography variant="small" tone="muted">
              Progress
            </Typography>
            <Typography variant="small" weight="medium">
              {Math.round(percentage)}%
            </Typography>
          </div>
        )}

        <div
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={indeterminate ? 'Loading...' : `${Math.round(percentage)}%`}
          className={cn(
            'w-full overflow-hidden rounded-full bg-neutral-200',
            progressSizes[size]
          )}
        >
          <div
            className={cn(
              'h-full transition-all duration-300 ease-in-out',
              progressTones[tone],
              indeterminate && 'animate-pulse'
            )}
            style={{
              width: indeterminate ? '100%' : `${percentage}%`,
            }}
          />
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

