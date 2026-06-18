import { PolymorphicComponentPropWithRef } from '@/utils'

export type TagVariant = 'solid' | 'outline' | 'soft'
export type TagSize = 'sm' | 'md' | 'lg'
export type TagTone = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

export type TagProps<C extends React.ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Visual variant
     * @default 'soft'
     */
    variant?: TagVariant
    /**
     * Tag size
     * @default 'md'
     */
    size?: TagSize
    /**
     * Semantic tone
     * @default 'default'
     */
    tone?: TagTone
    /**
     * Removable tag
     * @default false
     */
    removable?: boolean
    /**
     * Callback when remove button is clicked
     */
    onRemove?: () => void
  }
>

