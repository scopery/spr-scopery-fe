import React from 'react'

export type TextareaSize = 'sm' | 'md' | 'lg'
export type TextareaVariant = 'outline' | 'filled'
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /**
   * Textarea size
   * @default 'md'
   */
  size?: TextareaSize
  /**
   * Visual variant
   * @default 'outline'
   */
  variant?: TextareaVariant
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
   * Resize behavior
   * @default 'vertical'
   */
  resize?: TextareaResize
  /**
   * Full width textarea
   * @default false
   */
  fullWidth?: boolean
}

