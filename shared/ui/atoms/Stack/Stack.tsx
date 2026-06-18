import React from 'react'
import { cn } from '@/utils'
import type { StackProps } from './Stack.types'

const stackSpacing = {
  none: 'gap-0',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
  '2xl': 'gap-2xl',
}

const stackAlign = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const stackJustify = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

/**
 * Stack component - Flexible layout container
 *
 * @example
 * ```tsx
 * <Stack spacing="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Stack>
 * <Stack direction="horizontal" spacing="lg" align="center">
 *   <Button>Action</Button>
 *   <Button>Cancel</Button>
 * </Stack>
 * ```
 */
export const Stack = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      direction = 'vertical',
      spacing = 'md',
      align,
      justify,
      wrap = false,
      className,
      children,
      ...props
    }: StackProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component
        ref={ref}
        className={cn(
          'flex',
          direction === 'vertical' ? 'flex-col' : 'flex-row',
          stackSpacing[spacing],
          align && stackAlign[align],
          justify && stackJustify[justify],
          wrap && 'flex-wrap',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Stack.displayName = 'Stack'

