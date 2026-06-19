import React from 'react'
import { cn } from '@/utils/cn'
import type { BadgeProps } from './Badge.types'

const badgeVariants = {
  solid: {
    default: 'bg-neutral-900 text-white',
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
    progress: 'bg-progress text-white',
    neutral: 'bg-neutral-500 text-white',
  },
  outline: {
    default: 'border-2 border-neutral-900 text-neutral-900 bg-transparent',
    primary: 'border-2 border-primary text-primary bg-transparent',
    secondary: 'border-2 border-secondary text-secondary bg-transparent',
    success: 'border-2 border-success text-success bg-transparent',
    warning: 'border-2 border-warning text-warning bg-transparent',
    error: 'border-2 border-error text-error bg-transparent',
    info: 'border-2 border-info text-info bg-transparent',
    progress: 'border-2 border-progress text-progress bg-transparent',
    neutral: 'border-2 border-neutral-500 text-neutral-600 bg-transparent',
  },
  soft: {
    default: 'bg-neutral-100 text-neutral-900',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
    progress: 'bg-progress/10 text-progress',
    neutral: 'bg-neutral-100 text-neutral-600',
  },
}

const badgeSizes = {
  sm: 'px-sm py-xs text-xs',
  md: 'px-md py-xs text-sm',
  lg: 'px-md py-sm text-base',
}

/**
 * Badge component - Status indicator or label
 *
 * @example
 * ```tsx
 * <Badge>Default</Badge>
 * <Badge tone="success">Active</Badge>
 * <Badge variant="outline" tone="error">Error</Badge>
 * <Badge dot>With dot</Badge>
 * ```
 */
export const Badge = React.forwardRef(
  <C extends React.ElementType = 'span'>(
    {
      as,
      variant = 'solid',
      size = 'md',
      tone = 'default',
      dot = false,
      className,
      children,
      ...props
    }: BadgeProps<C>,
    ref?: React.Ref<HTMLSpanElement>
  ) => {
    const Component = as || 'span'

    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center gap-xs',
          'capitalize',
          'transition-colors duration-200',
          // Variant + Tone
          badgeVariants[variant][tone],
          // Size
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'inline-block rounded-full',
              size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-2.5 w-2.5',
              variant === 'solid' ? 'bg-white' : 'bg-current'
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </Component>
    )
  }
)

Badge.displayName = 'Badge'
