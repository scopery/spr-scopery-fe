import React from 'react'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerTone = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Spinner size
   * @default 'md'
   */
  size?: SpinnerSize
  /**
   * Color tone
   * @default 'primary'
   */
  tone?: SpinnerTone
  /**
   * Accessible label for screen readers
   */
  label?: string
}

