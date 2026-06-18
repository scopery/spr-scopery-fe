import React from 'react'
import { cn } from '@/utils'
import type { TagProps } from './Tag.types'

const tagVariants = {
  solid: {
    default: 'bg-neutral-900 text-white',
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
  },
  outline: {
    default: 'border-2 border-neutral-900 text-neutral-900 bg-transparent',
    primary: 'border-2 border-primary text-primary bg-transparent',
    secondary: 'border-2 border-secondary text-secondary bg-transparent',
    success: 'border-2 border-success text-success bg-transparent',
    warning: 'border-2 border-warning text-warning bg-transparent',
    error: 'border-2 border-error text-error bg-transparent',
    info: 'border-2 border-info text-info bg-transparent',
  },
  soft: {
    default: 'bg-neutral-100 text-neutral-900',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
  },
}

const tagSizes = {
  sm: 'px-sm py-xs text-xs gap-xs',
  md: 'px-md py-xs text-sm gap-xs',
  lg: 'px-md py-sm text-base gap-sm',
}

/**
 * Tag component - Removable label or category
 *
 * @example
 * ```tsx
 * <Tag>React</Tag>
 * <Tag tone="primary" removable onRemove={() => {}}>TypeScript</Tag>
 * <Tag variant="outline">Next.js</Tag>
 * ```
 */
export const Tag = React.forwardRef(
  <C extends React.ElementType = 'span'>(
    {
      as,
      variant = 'soft',
      size = 'md',
      tone = 'default',
      removable = false,
      onRemove,
      className,
      children,
      ...props
    }: TagProps<C>,
    ref?: React.Ref<HTMLSpanElement>
  ) => {
    const Component = as || 'span'

    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center',
          'rounded-md font-medium',
          'transition-colors duration-200',
          // Variant + Tone
          tagVariants[variant][tone],
          // Size
          tagSizes[size],
          className
        )}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className={cn(
              'inline-flex items-center justify-center rounded-sm',
              'hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current',
              'transition-colors duration-200',
              size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
            )}
            aria-label="Remove"
          >
            <svg
              className={cn(size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-3.5 w-3.5')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </Component>
    )
  }
)

Tag.displayName = 'Tag'

