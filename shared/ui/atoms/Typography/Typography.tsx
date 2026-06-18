import React from 'react'
import { cn } from '@/utils'
import type { TypographyProps, TypographyVariant } from './Typography.types'

const typographySizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
}

/* weight < 500 → Questrial | weight >= 500 → Cal Sans (Cal Sans đậm sẵn → CSS .font-calsans { font-weight: normal }) */
const typographyWeights = {
  normal: 'font-normal font-questrial',
  medium: 'font-medium font-calsans',
  semibold: 'font-semibold font-calsans',
  bold: 'font-bold font-calsans',
}

const typographyAligns = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

const typographyTones = {
  default: 'text-neutral-900',
  muted: 'text-neutral-600',
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
}

// Variant configurations: [defaultElement, defaultSize, defaultWeight, additionalClasses]
const variantConfig: Record<
  TypographyVariant,
  [string, string, string, string]
> = {
  h1: ['h1', '4xl', 'bold', ''],
  h2: ['h2', '3xl', 'bold', ''],
  h3: ['h3', '2xl', 'bold', ''],
  h4: ['h4', 'xl', 'bold', ''],
  h5: ['h5', 'lg', 'semibold', ''],
  h6: ['h6', 'base', 'semibold', ''],
  body: ['p', 'base', 'normal', 'leading-normal'],
  lead: ['p', 'lg', 'normal', 'leading-relaxed'],
  large: ['p', 'lg', 'normal', ''],
  small: ['p', 'sm', 'normal', ''],
  muted: ['p', 'sm', 'normal', 'text-neutral-600'],
  caption: ['p', 'sm', 'normal', 'leading-snug'],
  overline: ['p', 'xs', 'medium', 'uppercase tracking-wide'],
}

/**
 * Typography component - Universal text component
 *
 * Combines Text and Heading functionality into one flexible component
 *
 * @example
 * ```tsx
 * <Typography variant="h1">Page Title</Typography>
 * <Typography variant="body">Paragraph text</Typography>
 * <Typography variant="h2" size="xl">Smaller heading</Typography>
 * <Typography variant="caption" tone="muted">Caption text</Typography>
 * ```
 */
export const Typography = React.forwardRef(
  <C extends React.ElementType = 'p'>(
    {
      as,
      variant = 'body',
      size,
      weight,
      align,
      tone = 'default',
      truncate = false,
      italic = false,
      className,
      children,
      ...props
    }: TypographyProps<C>,
    ref?: React.Ref<HTMLElement>
  ) => {
    const [defaultElement, defaultSize, defaultWeight, additionalClasses] =
      variantConfig[variant]

    // Determine the HTML element
    const Component = (as || defaultElement) as React.ElementType

    // Use provided values or defaults from variant
    const effectiveSize = size || (defaultSize as keyof typeof typographySizes)
    const effectiveWeight = weight || (defaultWeight as keyof typeof typographyWeights)

    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles
          'transition-colors duration-200',
          // Additional variant classes
          additionalClasses,
          // Size
          typographySizes[effectiveSize],
          // Weight
          typographyWeights[effectiveWeight],
          // Alignment
          align && typographyAligns[align],
          // Tone (override variant tone if specified)
          variant !== 'muted' && typographyTones[tone],
          // Truncate
          truncate && 'truncate',
          // Italic
          italic && 'italic',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Typography.displayName = 'Typography'

