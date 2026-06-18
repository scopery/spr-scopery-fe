import React from 'react'
import { cn } from '@/utils'
import type { BoxProps } from './Box.types'

const displayStyles = {
  block: 'block',
  'inline-block': 'inline-block',
  flex: 'flex',
  'inline-flex': 'inline-flex',
  grid: 'grid',
  'inline-grid': 'inline-grid',
}

const paddingStyles = {
  none: '',
  xs: 'p-xs',
  sm: 'p-sm',
  md: 'p-md',
  lg: 'p-lg',
  xl: 'p-xl',
  '2xl': 'p-2xl',
}

const paddingXStyles = {
  none: '',
  xs: 'px-xs',
  sm: 'px-sm',
  md: 'px-md',
  lg: 'px-lg',
  xl: 'px-xl',
  '2xl': 'px-2xl',
}

const paddingYStyles = {
  none: '',
  xs: 'py-xs',
  sm: 'py-sm',
  md: 'py-md',
  lg: 'py-lg',
  xl: 'py-xl',
  '2xl': 'py-2xl',
}

const radiusStyles = {
  none: 'rounded-none',
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
}

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
}

const backgroundStyles = {
  transparent: 'bg-transparent',
  white: 'bg-white',
  'neutral-50': 'bg-neutral-50',
  'neutral-100': 'bg-neutral-100',
  'neutral-900': 'bg-neutral-900',
  primary: 'bg-primary',
}

const borderColorStyles = {
  none: '',
  'neutral-200': 'border-neutral-200',
  'neutral-300': 'border-neutral-300',
  primary: 'border-primary',
}

const borderWidthStyles = {
  none: 'border-0',
  '1': 'border',
  '2': 'border-2',
}

/**
 * Box component - Layout primitive
 *
 * @example
 * ```tsx
 * <Box padding="md" radius="md" shadow="sm">
 *   Content
 * </Box>
 * <Box display="flex" paddingX="lg" paddingY="md">
 *   Flex container
 * </Box>
 * <Box as="section" background="neutral-50" borderWidth="1" borderColor="neutral-200">
 *   Section with border
 * </Box>
 * ```
 */
export const Box = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      display = 'block',
      padding,
      paddingX,
      paddingY,
      radius,
      shadow,
      background,
      borderColor,
      borderWidth,
      className,
      children,
      ...props
    }: BoxProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component
        ref={ref}
        className={cn(
          // Display
          displayStyles[display],
          // Padding
          padding && paddingStyles[padding],
          paddingX && paddingXStyles[paddingX],
          paddingY && paddingYStyles[paddingY],
          // Border radius
          radius && radiusStyles[radius],
          // Shadow
          shadow && shadowStyles[shadow],
          // Background
          background && backgroundStyles[background],
          // Border
          borderWidth && borderWidthStyles[borderWidth],
          borderColor && borderColorStyles[borderColor],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Box.displayName = 'Box'

