import React from 'react'
import { cn } from '@/utils'
import { Typography } from '../Typography'
import type { RadioProps } from './Radio.types'

const radioSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

/**
 * Radio component - Radio button input
 *
 * @example
 * ```tsx
 * <Radio name="option" value="1" label="Option 1" />
 * <Radio name="option" value="2" label="Option 2" />
 * <Radio name="option" value="3" label="Option 3" helperText="Recommended" />
 * ```
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error,
      disabled = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const radioId = id ?? `radio-${generatedId}`
    const errorId = error ? `${radioId}-error` : undefined
    const helperTextId = helperText ? `${radioId}-helper` : undefined

    return (
      <div className={cn('flex flex-col gap-xs', className)}>
        <div className="flex items-start gap-sm">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            disabled={disabled}
            aria-describedby={cn(errorId, helperTextId)}
            className={cn(
              // Base styles
              'rounded-full border transition-colors duration-200',
              'focus:outline-none',
              'cursor-pointer',
              // Size
              radioSizes[size],
              // States
              error
                ? 'border-error text-error'
                : 'border-neutral-300 text-neutral-800',
              // Checked state
              'checked:border-neutral-800 checked:bg-neutral-800',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            {...props}
          />

          {label && (
            <label
              htmlFor={radioId}
              className={cn(
                'cursor-pointer select-none',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <Typography as="span" variant="small">
                {label}
              </Typography>
            </label>
          )}
        </div>

        {error && (
          <Typography id={errorId} variant="small" tone="error" role="alert" aria-live="polite">
            {error}
          </Typography>
        )}

        {helperText && !error && (
          <Typography id={helperTextId} variant="small" tone="muted">
            {helperText}
          </Typography>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'

