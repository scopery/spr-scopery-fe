import React from 'react'
import { cn } from '@/utils'
import { Typography } from '../Typography'
import type { DividerProps } from './Divider.types'

const dividerVariants = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
}

/**
 * Divider component - Visual separator
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" />
 * <Divider variant="dashed" />
 * <Divider label="OR" />
 * ```
 */
export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      label,
      className,
      ...props
    },
    ref
  ) => {
    if (label && orientation === 'horizontal') {
      return (
        <div
          className={cn('flex items-center gap-md', className)}
          role="separator"
          aria-label={label}
        >
          <hr
            ref={ref}
            className={cn(
              'flex-1 border-neutral-200',
              dividerVariants[variant],
              'border-t'
            )}
            {...props}
          />
          <Typography variant="small" tone="muted">
            {label}
          </Typography>
          <hr
            className={cn(
              'flex-1 border-neutral-200',
              dividerVariants[variant],
              'border-t'
            )}
          />
        </div>
      )
    }

    return (
      <hr
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          'border-neutral-200',
          dividerVariants[variant],
          orientation === 'horizontal'
            ? 'w-full border-t'
            : 'h-full border-l',
          className
        )}
        {...props}
      />
    )
  }
)

Divider.displayName = 'Divider'

