import React from 'react'
import { cn } from '@/utils'
import type { LinkProps } from './Link.types'

const linkVariants = {
  default: 'text-primary hover:text-primary-hover active:text-primary-active',
  primary: 'text-primary hover:text-primary-hover active:text-primary-active font-medium',
  muted: 'text-neutral-600 hover:text-neutral-900 active:text-neutral-900',
  underline:
    'text-neutral-900 underline decoration-2 underline-offset-2 hover:text-primary hover:decoration-primary',
}

const linkSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

/**
 * Link component - Accessible hyperlink
 *
 * @example
 * ```tsx
 * <Link href="/about">About Us</Link>
 * <Link href="https://example.com" external>External Link</Link>
 * <Link variant="underline">Underlined Link</Link>
 * ```
 */
export const Link = React.forwardRef(
  <C extends React.ElementType = 'a'>(
    {
      as,
      variant = 'default',
      size = 'md',
      external = false,
      disabled = false,
      className,
      children,
      href,
      ...props
    }: LinkProps<C>,
    ref?: React.Ref<HTMLAnchorElement>
  ) => {
    const Component = as || 'a'

    // External link props
    const externalProps = external
      ? {
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : {}

    return (
      <Component
        ref={ref}
        href={disabled ? undefined : href}
        className={cn(
          // Base styles
          'inline-flex items-center gap-xs',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'rounded-sm',
          // Variant
          linkVariants[variant],
          // Size
          linkSizes[size],
          // Disabled
          disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
          className
        )}
        aria-disabled={disabled}
        {...externalProps}
        {...props}
      >
        {children}
        {external && !disabled && (
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </Component>
    )
  }
)

Link.displayName = 'Link'

