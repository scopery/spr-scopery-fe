import React from 'react'
import { cn } from '@/utils'
import type { ButtonProps } from './Button.types'

const buttonVariants = {
  primary: 'bg-primary-gradient text-white hover:bg-primary-gradient-hover active:opacity-95',
  secondary: 'bg-secondary text-white hover:bg-secondary-hover active:bg-secondary-active',
  outline:
    'border-[1px] border-primary text-primary bg-transparent hover:bg-primary hover:text-white',
  ghost: 'text-primary bg-transparent hover:bg-neutral-100',
  glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 active:bg-white/30',
  'neutral-flat':
    'border border-neutral-00 text-neutral-900 bg-transparent rounded-none font-normal hover:bg-neutral-900 hover:text-white hover:border-neutral-900',
}

const buttonSizes = {
  sm: 'px-sm py-xs text-[13px] h-8',
  md: 'px-md py-sm text-sm h-10',
  lg: 'px-lg py-md text-base h-12',
}

const iconOnlySizes = {
  sm: 'h-8 w-8 p-0',
  md: 'h-10 w-10 p-0',
  lg: 'h-12 w-12 p-0',
}

const buttonTones = {
  default: '',
  success: 'bg-success hover:bg-success/90 active:bg-success/80 border-success text-white',
  warning: 'bg-warning hover:bg-warning/90 active:bg-warning/80 border-warning text-white',
  error: 'bg-error hover:bg-error/90 active:bg-error/80 border-error text-white',
}

/**
 * Button component - Primary interactive element
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button icon={<Icon />}>With Icon</Button>
 * <Button iconOnly icon={<Icon />} aria-label="Close" />
 * <Button as="a" href="/link">Link Button</Button>
 * <Button loading>Loading...</Button>
 * ```
 */
export const Button = React.forwardRef(
  <C extends React.ElementType = 'button'>(
    {
      as,
      variant = 'primary',
      size = 'md',
      tone = 'default',
      disabled = false,
      loading = false,
      fullWidth = false,
      icon,
      iconRight,
      iconOnly = false,
      className,
      children,
      ...props
    }: ButtonProps<C>,
    ref?: React.Ref<HTMLButtonElement>
  ) => {
    const Component = as || 'button'
    const isDisabled = disabled || loading

    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          iconOnly ? '' : 'gap-sm',
          'font-normal',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant styles
          tone === 'default' && buttonVariants[variant],
          tone !== 'default' && buttonTones[tone],
          // Size styles
          iconOnly ? iconOnlySizes[size] : buttonSizes[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {icon && <span className="inline-flex">{icon}</span>}
            {children}
            {iconRight && <span className="inline-flex">{iconRight}</span>}
          </>
        )}
      </Component>
    )
  }
)

Button.displayName = 'Button'

