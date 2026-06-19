import { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type UserProfileCardProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * User name
       * @default ''
       */
      name?: string
      /**
       * User title/role
       * @default ''
       */
      title?: string
      /**
       * User avatar image URL
       */
      avatar?: string
      /**
       * Callback when notification bell is clicked
       */
      onNotificationClick?: () => void
      /**
       * Border radius for the card container
       */
      cardBorderRadius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
      /**
       * Shadow for the card container
       */
      cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    }
  >
