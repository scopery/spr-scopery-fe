import { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type NotificationCardProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * Title of the notification section
       * @default 'Notifications'
       */
      title?: string
      /**
       * Sender information
       * @default { name: '' }
       */
      sender?: {
        name: string
        role?: string
        avatar?: string
      }
      /**
       * Notification message
       * @default ''
       */
      message?: string
      /**
       * Time ago (e.g., "5 mins")
       */
      timeAgo?: string
      /**
       * Whether notification is read
       * @default false
       */
      read?: boolean
      /**
       * Callback when send button is clicked
       */
      onSend?: () => void
      /**
       * Callback when notification is clicked
       */
      onClick?: () => void
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
