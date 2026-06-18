import React from 'react'

export type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type SpacerAxis = 'horizontal' | 'vertical' | 'both'

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Spacing size
   * @default 'md'
   */
  size?: SpacerSize
  /**
   * Spacing axis
   * @default 'vertical'
   */
  axis?: SpacerAxis
}

