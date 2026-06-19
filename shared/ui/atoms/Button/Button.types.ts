import { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'neutral-flat'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonTone = 'default' | 'success' | 'warning' | 'error'

export type ButtonProps<C extends React.ElementType = 'button'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Visual style variant
     * @default 'primary'
     */
    variant?: ButtonVariant
    /**
     * Size of the button
     * @default 'md'
     */
    size?: ButtonSize
    /**
     * Semantic tone for the button
     * @default 'default'
     */
    tone?: ButtonTone
    /**
     * Whether the button is disabled
     * @default false
     */
    disabled?: boolean
    /**
     * Whether the button is in a loading state
     * @default false
     */
    loading?: boolean
    /**
     * Full width button
     * @default false
     */
    fullWidth?: boolean
    /**
     * Icon element (left side)
     */
    icon?: React.ReactNode
    /**
     * Icon element (right side)
     */
    iconRight?: React.ReactNode
    /**
     * Icon-only button (no text)
     * @default false
     */
    iconOnly?: boolean
  }
>
