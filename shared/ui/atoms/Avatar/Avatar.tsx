import React from 'react'
import { cn } from '@/utils'
import type { AvatarProps } from './Avatar.types'

const avatarSizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
}

const avatarShapes = {
  circle: 'rounded-full',
  square: 'rounded-md',
}

const statusColors = {
  online: 'bg-success',
  offline: 'bg-neutral-400',
  away: 'bg-warning',
  busy: 'bg-error',
}

const statusSizes = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
  '2xl': 'h-5 w-5',
}

/**
 * Avatar component - User avatar with image or initials
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" />
 * <Avatar fallback="JD" />
 * <Avatar fallback="AB" status="online" />
 * <Avatar src="/user.jpg" shape="square" />
 * ```
 */
export const Avatar = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      size = 'md',
      shape = 'circle',
      src,
      alt = '',
      fallback,
      status,
      className,
      ...props
    }: AvatarProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'
    const [imageError, setImageError] = React.useState(false)
    const showImage = src && !imageError

    return (
      <Component
        ref={ref}
        className={cn('relative inline-flex', className)}
        {...props}
      >
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden bg-neutral-200 font-medium text-neutral-700',
            avatarSizes[size],
            avatarShapes[shape]
          )}
        >
          {showImage ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : fallback ? (
            <span aria-label={alt || fallback}>{fallback}</span>
          ) : (
            <svg
              className="h-full w-full text-neutral-400"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-white',
              statusColors[status],
              statusSizes[size]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </Component>
    )
  }
)

Avatar.displayName = 'Avatar'

