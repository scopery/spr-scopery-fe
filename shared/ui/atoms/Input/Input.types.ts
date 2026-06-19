import React from 'react'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'outline' | 'filled'
export type InputState = 'default' | 'error' | 'success'

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix'
> {
  /**
   * Input size
   * @default 'md'
   */
  size?: InputSize
  /**
   * Visual variant
   * @default 'outline'
   */
  variant?: InputVariant
  /**
   * Input state
   * @default 'default'
   */
  state?: InputState
  /**
   * Full width input
   * @default false
   */
  fullWidth?: boolean
  /**
   * Error message
   */
  error?: string
  /**
   * Helper text
   */
  helperText?: string
  /**
   * Label text
   */
  label?: string
  /**
   * Required field indicator
   */
  required?: boolean
  /**
   * Prefix icon or element
   */
  prefix?: React.ReactNode
  /**
   * Postfix icon or element
   */
  postfix?: React.ReactNode
}
