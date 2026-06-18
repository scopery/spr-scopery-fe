import React from 'react'

export type ProgressSize = 'sm' | 'md' | 'lg'
export type ProgressTone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'size'> {
  /**
   * Progress value (0-100)
   * @default 0
   */
  value?: number
  /**
   * Maximum value
   * @default 100
   */
  max?: number
  /**
   * Progress size
   * @default 'md'
   */
  size?: ProgressSize
  /**
   * Color tone
   * @default 'primary'
   */
  tone?: ProgressTone
  /**
   * Show value label
   * @default false
   */
  showValue?: boolean
  /**
   * Indeterminate loading state
   * @default false
   */
  indeterminate?: boolean
}

