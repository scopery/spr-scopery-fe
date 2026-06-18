import React from 'react'
import { cn } from '@/utils'
import type { InputProps } from './Input.types'

const inputSizes = {
  sm: 'h-10 text-sm',
  md: 'h-12 text-sm',
  lg: 'h-14 text-base',
}

const inputPadding = {
  sm: {
    x: 'px-3',
    left: 'pl-3',
    right: 'pr-3',
    withPrefix: 'pl-10',
    withPostfix: 'pr-10',
  },
  md: {
    x: 'px-3',
    left: 'pl-3',
    right: 'pr-3',
    withPrefix: 'pl-10',
    withPostfix: 'pr-10',
  },
  lg: {
    x: 'px-4',
    left: 'pl-4',
    right: 'pr-4',
    withPrefix: 'pl-12',
    withPostfix: 'pr-12',
  },
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]',
  lg: 'w-6 h-6',
}

const iconPositions = {
  sm: 'left-3',
  md: 'left-3',
  lg: 'left-4',
}

const inputVariants = {
  outline: 'border bg-white',
  filled: 'border-0 bg-neutral-100',
}

const inputStates = {
  default: 'border-neutral-300 focus:border-primary focus:ring-1 focus:ring-primary/20',
  error: 'border-error focus:border-error focus:ring-1 focus:ring-error/20',
  success: 'border-success focus:border-success focus:ring-1 focus:ring-success/20',
}

/**
 * Input component - Form input field with prefix/postfix support
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter text" />
 * <Input label="Email" type="email" required />
 * <Input prefix={<MailIcon />} placeholder="Enter your email" />
 * <Input postfix={<EyeIcon />} type="password" />
 * <Input error="This field is required" />
 * <Input helperText="Optional helper text" />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      state = 'default',
      fullWidth = false,
      error,
      helperText,
      label,
      required = false,
      disabled = false,
      prefix,
      postfix,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? `input-${generatedId}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperTextId = helperText ? `${inputId}-helper` : undefined
    const effectiveState = error ? 'error' : state

    // Determine padding based on prefix/postfix
    const getPaddingClasses = () => {
      if (prefix && postfix) {
        return `${inputPadding[size].withPrefix} ${inputPadding[size].withPostfix}`
      }
      if (prefix) {
        return `${inputPadding[size].withPrefix} ${inputPadding[size].right}`
      }
      if (postfix) {
        return `${inputPadding[size].left} ${inputPadding[size].withPostfix}`
      }
      return inputPadding[size].x
    }

    return (
      <div className={cn('flex flex-col gap-2', fullWidth ? 'w-full' : 'min-w-[280px]')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-normal text-neutral-700 cursor-pointer"
          >
            {label}
            {required && (
              <span className="ml-1 text-error" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {prefix && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-neutral-500',
                iconPositions[size],
                iconSizes[size]
              )}
            >
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={effectiveState === 'error'}
            aria-describedby={cn(errorId, helperTextId)}
            className={cn(
              // Base styles
              'transition-colors duration-200 w-full font-normal',
              'placeholder:text-neutral-400',
              'focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
              // Size
              inputSizes[size],
              // Padding
              getPaddingClasses(),
              // Variant
              inputVariants[variant],
              // State
              inputStates[effectiveState],
              className
            )}
            {...props}
          />

          {postfix && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-neutral-500 cursor-pointer',
                size === 'sm' ? 'right-2.5' : size === 'md' ? 'right-3' : 'right-4',
                iconSizes[size]
              )}
            >
              {postfix}
            </div>
          )}
        </div>

        {error && (
          <span
            id={errorId}
            className="text-xs font-normal text-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </span>
        )}

        {helperText && !error && (
          <span id={helperTextId} className="text-xs font-normal text-neutral-500">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

