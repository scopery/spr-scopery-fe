import React from 'react'

export type DividerOrientation = 'horizontal' | 'vertical'
export type DividerVariant = 'solid' | 'dashed' | 'dotted'

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  /**
   * Divider orientation
   * @default 'horizontal'
   */
  orientation?: DividerOrientation
  /**
   * Line variant
   * @default 'solid'
   */
  variant?: DividerVariant
  /**
   * Label text
   */
  label?: string
}

