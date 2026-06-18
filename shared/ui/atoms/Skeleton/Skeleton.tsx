import React from 'react'
import { cn } from '@/utils'
import type { SkeletonProps } from './Skeleton.types'

const skeletonVariants = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-md',
}

/**
 * Skeleton component - Loading placeholder
 *
 * @example
 * ```tsx
 * <Skeleton />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" width="100%" height={200} />
 * ```
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      noAnimation = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const defaultHeight = variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100px'

    const inlineStyles: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height || defaultHeight,
      ...style,
    }

    return (
      <div
        ref={ref}
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading..."
        className={cn(
          'bg-neutral-200',
          skeletonVariants[variant],
          !noAnimation && 'animate-pulse',
          className
        )}
        style={inlineStyles}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

