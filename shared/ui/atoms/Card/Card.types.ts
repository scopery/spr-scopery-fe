import type { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type CardProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  {
      /** Controls the standard `shadow-sm` elevation. @default true */
    hasShadow?: boolean
  }
>
