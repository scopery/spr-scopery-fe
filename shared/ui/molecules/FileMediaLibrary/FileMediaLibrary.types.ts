import { PolymorphicComponentPropWithRef } from '@/utils'

export type FileMediaLibraryProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * Title of the file library
       * @default 'File & media library'
       */
      title?: string
      /**
       * Folder information
       * @default { name: '', fileCount: 0 }
       */
      folder?: {
        name: string
        fileCount: number
        description?: string
        previewImages?: string[]
      }
      /**
       * Action button text
       * @default 'Open the folder'
       */
      actionLabel?: string
      /**
       * Callback when add button is clicked
       */
      onAdd?: () => void
      /**
       * Callback when share button is clicked
       */
      onShare?: () => void
      /**
       * Callback when action button is clicked
       */
      onAction?: () => void
      /**
       * Callback when previous navigation is clicked
       */
      onPrevious?: () => void
      /**
       * Callback when next navigation is clicked
       */
      onNext?: () => void
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

