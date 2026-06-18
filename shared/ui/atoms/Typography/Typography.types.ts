import { PolymorphicComponentPropWithRef } from '@/utils'

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'lead'
  | 'large'
  | 'small'
  | 'muted'
  | 'caption'
  | 'overline'

export type TypographySize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
export type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold'
export type TypographyAlign = 'left' | 'center' | 'right' | 'justify'
export type TypographyTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

export type TypographyProps<C extends React.ElementType = 'p'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * Typography variant (determines default element and styles)
       * @default 'body'
       */
      variant?: TypographyVariant
      /**
       * Font size (overrides variant default)
       */
      size?: TypographySize
      /**
       * Font weight (overrides variant default)
       */
      weight?: TypographyWeight
      /**
       * Text alignment
       */
      align?: TypographyAlign
      /**
       * Text color tone
       * @default 'default'
       */
      tone?: TypographyTone
      /**
       * Truncate text with ellipsis
       * @default false
       */
      truncate?: boolean
      /**
       * Italic text
       * @default false
       */
      italic?: boolean
    }
  >

