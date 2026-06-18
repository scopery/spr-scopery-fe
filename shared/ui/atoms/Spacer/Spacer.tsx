import React from 'react'
import { cn } from '@/utils'
import type { SpacerProps } from './Spacer.types'

const spacerSizes = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
}

/**
 * Spacer component - Flexible spacing utility
 *
 * @example
 * ```tsx
 * <Spacer />
 * <Spacer size="lg" />
 * <Spacer axis="horizontal" />
 * ```
 */
export const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ size = 'md', axis = 'vertical', className, ...props }, ref) => {
    const sizeValue = spacerSizes[size]

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          axis === 'vertical' && `h-${sizeValue}`,
          axis === 'horizontal' && `w-${sizeValue}`,
          axis === 'both' && `h-${sizeValue} w-${sizeValue}`,
          className
        )}
        {...props}
      />
    )
  }
)

Spacer.displayName = 'Spacer'

