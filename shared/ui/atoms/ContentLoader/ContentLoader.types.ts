import React from 'react'

export type ContentLoaderVariant = 'default' | 'easeOut'

export interface ContentLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant: default (2x4 grid + pulse) or easeOut (2x3 grid, 4-frame animation with ease-out)
   * @default 'default'
   */
  variant?: ContentLoaderVariant
  /**
   * Whether to show animation (pulse for default, 4-frame for easeOut). Ignored if variant is easeOut (always animated).
   * @default true
   */
  animated?: boolean
  /**
   * Optional fixed width (e.g. "100%", 320)
   */
  width?: string | number
  /**
   * Optional fixed height (e.g. "200px", 160)
   */
  height?: string | number
}
