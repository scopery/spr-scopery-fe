import React from 'react'
import { cn } from '@/utils'
import type { TextareaProps } from './Textarea.types'

const textareaSizes = {
  sm: 'px-3 py-2.5 text-sm min-h-20',
  md: 'px-3 py-3 text-sm min-h-24',
  lg: 'px-4 py-3.5 text-base min-h-32',
}

const textareaVariants = {
  outline: 'border bg-white',
  filled: 'border-0 bg-neutral-100',
}

const textareaResize = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
}

/**
 * Textarea component - Multi-line text input
 *
 * @example
 * ```tsx
 * <Textarea label="Description" placeholder="Enter description" />
 * <Textarea rows={5} resize="none" />
 * <Textarea error="This field is required" />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      resize = 'vertical',
      fullWidth = false,
      error,
      helperText,
      label,
      required = false,
      disabled = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const textareaId = id ?? `textarea-${generatedId}`
    const errorId = error ? `${textareaId}-error` : undefined
    const helperTextId = helperText ? `${textareaId}-helper` : undefined

    const resizeToFit = React.useCallback(() => {
      if (!textareaRef.current) return
      // Reset height to allow shrinking, then set to scrollHeight for content fit.
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }, [])

    React.useLayoutEffect(() => {
      resizeToFit()
    }, [resizeToFit, props.value])

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
        }
      },
      [ref]
    )

    return (
      <div className={cn('flex flex-col gap-2', fullWidth ? 'w-full' : 'min-w-[280px]')}>
        {label && (
          <label
            htmlFor={textareaId}
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

        <textarea
          ref={setRefs}
          id={textareaId}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, helperTextId)}
          className={cn(
            // Base styles
            'transition-colors duration-200 w-full font-normal',
            'placeholder:text-neutral-400',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
            // Size
            textareaSizes[size],
            // Variant
            textareaVariants[variant],
            // Resize
            textareaResize[resize],
            // States
            error
              ? 'border-error focus:border-error focus:ring-1 focus:ring-error/20'
              : 'border-neutral-300 focus:ring-1 focus:ring-neutral-100',
            className
          )}
          onInput={(event) => {
            resizeToFit()
            props.onInput?.(event)
          }}
          {...props}
        />

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

Textarea.displayName = 'Textarea'
