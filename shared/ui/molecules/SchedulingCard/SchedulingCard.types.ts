import { PolymorphicComponentPropWithRef } from '@/utils'

export type SchedulingCardProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * Title of the scheduling section
       * @default 'Scheduling'
       */
      title?: string
      /**
       * Description text below title
       */
      description?: string
      /**
       * Day of the week (e.g., "FRIDAY")
       */
      day?: string
      /**
       * Date (e.g., "Mar 28")
       */
      date?: string
      /**
       * Event information
       * @default { title: '' }
       */
      event?: {
        title: string
        location?: string
        time?: string
        image?: string
        imageAlt?: string
      }
      /**
       * Action button text
       * @default 'Mark this event'
       */
      actionLabel?: string
      /**
       * Callback when action button is clicked
       */
      onAction?: () => void
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

