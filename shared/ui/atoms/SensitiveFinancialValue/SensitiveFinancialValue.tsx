import React from 'react'
import { cn } from '@/utils/cn'
import { Typography } from '../Typography'
import { CurrencyAmount } from '../CurrencyAmount'
import {
  SensitiveFinancialState,
  type SensitiveFinancialValueProps,
} from './SensitiveFinancialValue.types'

const DEFAULT_MESSAGES: Record<
  Exclude<SensitiveFinancialValueProps['state'], 'visible' | 'masked'>,
  string
> = {
  unavailable: 'Unavailable',
  mixedCurrency: 'Mixed currencies',
  permissionRequired: 'Permission required',
}

/**
 * SensitiveFinancialValue — safe display for financial fields.
 * Never renders a masked value as 0.
 */
export const SensitiveFinancialValue = React.forwardRef<
  HTMLSpanElement,
  SensitiveFinancialValueProps
>(
  (
    {
      state,
      amount,
      currency = 'USD',
      locale,
      approximate,
      size = 'md',
      className,
      message,
    },
    ref
  ) => {
    if (state === SensitiveFinancialState.Visible) {
      return (
        <CurrencyAmount
          ref={ref}
          amount={amount}
          currency={currency}
          locale={locale}
          approximate={approximate}
          size={size}
          className={className}
        />
      )
    }

    if (state === SensitiveFinancialState.Masked) {
      return (
        <CurrencyAmount
          ref={ref}
          amount={amount}
          currency={currency}
          masked
          size={size}
          className={className}
        />
      )
    }

    const label = message ?? DEFAULT_MESSAGES[state]

    return (
      <Typography
        as="span"
        ref={ref}
        variant={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'body'}
        tone="muted"
        className={cn(className)}
        role="status"
      >
        {label}
      </Typography>
    )
  }
)

SensitiveFinancialValue.displayName = 'SensitiveFinancialValue'
