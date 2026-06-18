import { PolymorphicComponentPropWithRef } from '@/utils'

export type BoxDisplay = 'block' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid'
export type BoxPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type BoxRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
export type BoxShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export type BoxProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Display type
     * @default 'block'
     */
    display?: BoxDisplay
    /**
     * Padding (all sides)
     */
    padding?: BoxPadding
    /**
     * Padding X axis (left/right)
     */
    paddingX?: BoxPadding
    /**
     * Padding Y axis (top/bottom)
     */
    paddingY?: BoxPadding
    /**
     * Border radius
     */
    radius?: BoxRadius
    /**
     * Box shadow
     */
    shadow?: BoxShadow
    /**
     * Background color
     */
    background?: 'transparent' | 'white' | 'neutral-50' | 'neutral-100' | 'neutral-900' | 'primary'
    /**
     * Border color
     */
    borderColor?: 'none' | 'neutral-200' | 'neutral-300' | 'primary'
    /**
     * Border width
     */
    borderWidth?: 'none' | '1' | '2'
  }
>

