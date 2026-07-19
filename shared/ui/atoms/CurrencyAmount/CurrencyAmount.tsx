import React from 'react'
import { cn } from '@/utils/cn'
import { Typography } from '../Typography'
import type { CurrencyAmountProps } from './CurrencyAmount.types'

const sizeToTypography = {
  sm: 'small' as const,
  md: 'body' as const,
  lg: 'large' as const,
}

function formatAmount(
  amount: number,
  currency: string,
  locale: string | undefined
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
    }).format(amount)
  } catch {
    // Invalid currency/locale — fall back without crashing
    return `${amount} ${currency}`
  }
}

/**
 * CurrencyAmount — locale-aware money display with masking support.
 * Never converts currencies. Never renders a masked value as 0.
 */
export const CurrencyAmount = React.forwardRef<HTMLSpanElement, CurrencyAmountProps>(
  (
    {
      amount,
      currency,
      locale,
      masked = false,
      approximate = false,
      size = 'md',
      className,
      maskedLabel = 'Hidden amount',
    },
    ref
  ) => {
    if (masked) {
      return (
        <Typography
          as="span"
          ref={ref}
          variant={sizeToTypography[size]}
          weight="medium"
          tone="muted"
          className={cn('tabular-nums tracking-wider', className)}
          aria-label={maskedLabel}
        >
          •••••
        </Typography>
      )
    }

    if (amount == null || Number.isNaN(amount)) {
      return (
        <Typography
          as="span"
          ref={ref}
          variant={sizeToTypography[size]}
          tone="muted"
          className={cn('tabular-nums', className)}
          aria-label="No amount"
        >
          —
        </Typography>
      )
    }

    const formatted = formatAmount(amount, currency, locale)
    const isNegative = amount < 0

    return (
      <Typography
        as="span"
        ref={ref}
        variant={sizeToTypography[size]}
        weight="medium"
        tone={isNegative ? 'error' : 'default'}
        className={cn('tabular-nums', className)}
        title={`${currency}`}
      >
        {approximate ? `~${formatted}` : formatted}
      </Typography>
    )
  }
)

CurrencyAmount.displayName = 'CurrencyAmount'
