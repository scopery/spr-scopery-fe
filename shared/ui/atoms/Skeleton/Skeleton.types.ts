import React from 'react'

export type SkeletonVariant = 'text' | 'circular' | 'rectangular'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Skeleton variant
   * @default 'text'
   */
  variant?: SkeletonVariant
  /**
   * Width (CSS value or number for px)
   */
  width?: string | number
  /**
   * Height (CSS value or number for px)
   */
  height?: string | number
  /**
   * Disable animation
   * @default false
   */
  noAnimation?: boolean
}

