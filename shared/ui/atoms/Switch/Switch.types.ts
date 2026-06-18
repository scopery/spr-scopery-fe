import React from 'react'

export type SwitchSize = 'sm' | 'md' | 'lg'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Switch size
   * @default 'md'
   */
  size?: SwitchSize
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
}

