import React from 'react'
import { cn } from '@/utils'
import { Typography } from '../Typography'
import type { SwitchProps } from './Switch.types'

const switchSizes = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
  },
}

/**
 * Switch component - Toggle switch input
 *
 * @example
 * ```tsx
 * <Switch label="Enable notifications" />
 * <Switch label="Dark mode" defaultChecked />
 * <Switch label="Auto-save" helperText="Saves automatically" />
 * ```
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error,
      disabled = false,
      className,
      id,
      checked,
      defaultChecked,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const switchId = id ?? `switch-${generatedId}`
    const errorId = error ? `${switchId}-error` : undefined
    const helperTextId = helperText ? `${switchId}-helper` : undefined

    const [isChecked, setIsChecked] = React.useState(defaultChecked || false)
    const isControlled = checked !== undefined
    const switchChecked = isControlled ? checked : isChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setIsChecked(e.target.checked)
      }
      props.onChange?.(e)
    }

    return (
      <div className={cn('flex flex-col gap-xs', className)}>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            role="switch"
            aria-checked={switchChecked}
            aria-labelledby={label ? `${switchId}-label` : undefined}
            aria-describedby={cn(errorId, helperTextId)}
            disabled={disabled}
            onClick={() => {
              const input = document.getElementById(switchId) as HTMLInputElement
              input?.click()
            }}
            className={cn(
              // Track
              'relative inline-flex items-center rounded-full transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'cursor-pointer',
              // Size
              switchSizes[size].track,
              // States
              error
                ? switchChecked
                  ? 'bg-error'
                  : 'bg-error/20'
                : switchChecked
                  ? 'bg-primary'
                  : 'bg-neutral-300',
              // Disabled
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <span
              className={cn(
                // Thumb
                'inline-block rounded-full bg-white shadow-md transition-transform duration-200',
                // Size
                switchSizes[size].thumb,
                // Position
                switchChecked ? switchSizes[size].translate : 'translate-x-0.5'
              )}
            />
          </button>

          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={switchChecked}
            disabled={disabled}
            onChange={handleChange}
            className="sr-only"
            {...props}
          />

          {label && (
            <label
              id={`${switchId}-label`}
              htmlFor={switchId}
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

Switch.displayName = 'Switch'

