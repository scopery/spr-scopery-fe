import { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type AISuggestionProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * Title/heading of the suggestion
       * @default 'AI suggestions'
       */
      title?: string
      /**
       * Question or suggestion text
       * @default ''
       */
      question?: string
      /**
       * Label for the "Yes" option
       * @default 'Yes'
       */
      yesLabel?: string
      /**
       * Label for the "No" option
       * @default 'No'
       */
      noLabel?: string
      /**
       * Callback when "Yes" is clicked
       */
      onYes?: () => void
      /**
       * Callback when "No" is clicked
       */
      onNo?: () => void
      /**
       * Show icon next to title
       * @default true
       */
      showIcon?: boolean
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
