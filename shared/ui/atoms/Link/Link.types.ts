import { PolymorphicComponentPropWithRef } from '@/utils'

export type LinkVariant = 'default' | 'primary' | 'muted' | 'underline'
export type LinkSize = 'sm' | 'md' | 'lg'

export type LinkProps<C extends React.ElementType = 'a'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Visual variant
     * @default 'default'
     */
    variant?: LinkVariant
    /**
     * Link size
     * @default 'md'
     */
    size?: LinkSize
    /**
     * External link (opens in new tab)
     * @default false
     */
    external?: boolean
    /**
     * Disabled state
     * @default false
     */
    disabled?: boolean
  }
>

