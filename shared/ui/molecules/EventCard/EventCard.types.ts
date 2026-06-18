import { PolymorphicComponentPropWithRef } from '@/utils'

export type EventCardProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * Event title
       * @default ''
       */
      title?: string
      /**
       * Event description
       */
      description?: string
      /**
       * Event time range (e.g., "09:00 am - 09:30 am")
       */
      time?: string
      /**
       * Cover image URL
       */
      image?: string
      /**
       * Alt text for the image
       */
      imageAlt?: string
      /**
       * Show copy link button
       * @default false
       */
      showCopyLink?: boolean
      /**
       * Copy link button text
       * @default 'Copy the link'
       */
      copyLinkText?: string
      /**
       * Callback when copy link button is clicked
       */
      onCopyLink?: () => void
      /**
       * Show share button on image
       * @default false
       */
      showShareButton?: boolean
      /**
       * Callback when share button is clicked
       */
      onShare?: () => void
      /**
       * Callback when card is clicked
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

