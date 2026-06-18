import React from 'react'

export type CheckboxSize = 'sm' | 'md' | 'lg'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Checkbox size
   * @default 'md'
   */
  size?: CheckboxSize
  /**
   * Label text
   */
  label?: string
  /**
   * Helper text
   */
  helperText?: string
  /**
   * Error message
   */
  error?: string
  /**
   * Indeterminate state
   * @default false
   */
  indeterminate?: boolean
}

