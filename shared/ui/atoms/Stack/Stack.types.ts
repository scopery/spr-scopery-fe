import { PolymorphicComponentPropWithRef } from '@/utils'

export type StackDirection = 'horizontal' | 'vertical'
export type StackSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

export type StackProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Stack direction
     * @default 'vertical'
     */
    direction?: StackDirection
    /**
     * Spacing between items
     * @default 'md'
     */
    spacing?: StackSpacing
    /**
     * Align items
     */
    align?: StackAlign
    /**
     * Justify content
     */
    justify?: StackJustify
    /**
     * Wrap items
     * @default false
     */
    wrap?: boolean
  }
>

