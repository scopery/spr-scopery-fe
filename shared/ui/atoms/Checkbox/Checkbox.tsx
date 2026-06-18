import React from 'react'
import { cn } from '@/utils'
import { Typography } from '../Typography'
import type { CheckboxProps } from './Checkbox.types'

const checkboxSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

// Custom checkbox styles with thin checkmark
const checkboxStyles = `
  input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
  }
  
  input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 45%;
    transform: translate(-50%, -50%) rotate(45deg);
    width: 30%;
    height: 55%;
    border: solid #171717;
    border-width: 0 2px 2px 0;
  }
  
  input[type="checkbox"]:indeterminate::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 2px;
    background: #171717;
  }
`

/**
 * Checkbox component - Accessible checkbox input
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms" />
 * <Checkbox label="Subscribe" helperText="Get updates" />
 * <Checkbox indeterminate label="Select all" />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error,
      indeterminate = false,
      disabled = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const checkboxId = id ?? `checkbox-${generatedId}`
    const errorId = error ? `${checkboxId}-error` : undefined
    const helperTextId = helperText ? `${checkboxId}-helper` : undefined

    const inputRef = React.useRef<HTMLInputElement>(null)

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!)

    // Handle indeterminate state
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    return (
      <>
        <style>{checkboxStyles}</style>
        <div className={cn('flex flex-col gap-xs', className)}>
          <div className="flex items-start gap-sm">
            <input
              ref={inputRef}
              type="checkbox"
              id={checkboxId}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={cn(errorId, helperTextId)}
              className={cn(
                // Base styles
                'border transition-colors duration-200',
                'focus:outline-none',
                'cursor-pointer',
                // Size
                checkboxSizes[size],
                // States: viền neutral-200, nền trắng; check màu đen
                error
                  ? 'border-error text-error bg-white'
                  : 'border-neutral-200 bg-white',
                // Checked: giữ nền trắng, check đen (trong checkboxStyles)
                'checked:border-neutral-200 checked:bg-white',
                'indeterminate:border-neutral-200 indeterminate:bg-white',
                // Disabled
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              {...props}
            />

          {label && (
            <label
              htmlFor={checkboxId}
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
      </>
    )
  }
)

Checkbox.displayName = 'Checkbox'

