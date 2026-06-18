import React from 'react'
import { cn } from '@/utils'
import type { SpinnerProps } from './Spinner.types'

const spinnerSizes = {
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
}

const spinnerTones = {
  default: 'border-neutral-900',
  primary: 'border-primary',
  secondary: 'border-secondary',
  success: 'border-success',
  warning: 'border-warning',
  error: 'border-error',
  info: 'border-info',
}

/**
 * Spinner component - Loading indicator
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" tone="primary" />
 * <Spinner label="Loading content..." />
 * ```
 */
export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', tone = 'primary', label = 'Loading...', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn('inline-block', className)}
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full border-transparent',
            spinnerSizes[size],
            spinnerTones[tone],
            'border-t-current'
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

