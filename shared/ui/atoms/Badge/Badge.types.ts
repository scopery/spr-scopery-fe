import { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type BadgeVariant = 'solid' | 'outline' | 'soft'
export type BadgeSize = 'sm' | 'md' | 'lg'
export type BadgeTone =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'progress'
  | 'neutral'

export type BadgeProps<C extends React.ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Visual variant
     * @default 'solid'
     */
    variant?: BadgeVariant
    /**
     * Badge size
     * @default 'md'
     */
    size?: BadgeSize
    /**
     * Semantic tone
     * @default 'default'
     */
    tone?: BadgeTone
    /**
     * Show dot indicator
     * @default false
     */
    dot?: boolean
  }
>
