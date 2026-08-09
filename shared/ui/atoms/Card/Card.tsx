import React from 'react'
import { cn } from '@/utils/cn'
import type { CardProps } from './Card.types'

/**
 * Minimal shared card wrapper.
 *
 * Layout and padding stay caller-controlled through `className`.
 * Surface, square corners, elevation, and content clipping stay centralized.
 */
export const Card = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    { as, hasShadow = true, className, children, ...props }: CardProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component
        ref={ref}
        className={cn(
          'min-w-0 overflow-hidden border border-neutral-200 bg-surface-card',
          hasShadow && 'shadow-sm-comment',
          className,
          'rounded-none'
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'
