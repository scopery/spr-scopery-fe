import React from 'react'
import { cn } from '@/utils/cn'
import type { MaskedValueProps } from './MaskedValue.types'

/**
 * MaskedValue — never renders numeric 0 as a masked stand-in.
 */
export const MaskedValue = React.forwardRef<HTMLSpanElement, MaskedValueProps>(
  ({ value, masked = true, maskLabel = '••••••', className, onReveal }, ref) => {
    if (masked) {
      return (
        <span
          ref={ref}
          className={cn(
            'font-mono text-sm tracking-wider text-neutral-500',
            onReveal && 'cursor-pointer underline-offset-2 hover:underline',
            className
          )}
          aria-label="Masked value"
          title={onReveal ? 'Click to request reveal' : undefined}
          onClick={onReveal}
          role={onReveal ? 'button' : undefined}
          tabIndex={onReveal ? 0 : undefined}
          onKeyDown={
            onReveal
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onReveal()
                  }
                }
              : undefined
          }
        >
          {maskLabel}
        </span>
      )
    }

    return (
      <span ref={ref} className={cn('text-sm text-neutral-900', className)}>
        {value ?? '—'}
      </span>
    )
  }
)

MaskedValue.displayName = 'MaskedValue'
