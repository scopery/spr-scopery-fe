import React from 'react'
import { cn } from '@/utils/cn'
import { Typography } from '../../atoms/Typography'
import type { FinancialKpiStripProps } from './FinancialKpiStrip.types'

const deltaToneClass = {
  positive: 'text-success',
  negative: 'text-error',
  neutral: 'text-neutral-600',
} as const

/**
 * FinancialKpiStrip — horizontal strip of financial KPIs.
 * Values are passed as nodes so callers control CurrencyAmount / masking.
 */
export const FinancialKpiStrip = React.forwardRef<HTMLDivElement, FinancialKpiStripProps>(
  (
    {
      items,
      mode = 'compact',
      className,
      'aria-label': ariaLabel = 'Financial metrics',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        className={cn(
          'flex flex-wrap gap-md border-b border-neutral-200 pb-md',
          mode === 'expanded' && 'gap-lg',
          className
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'min-w-[7.5rem] flex-1',
              mode === 'expanded' && 'min-w-[10rem]'
            )}
          >
            <Typography variant="overline" tone="muted" className="mb-xs">
              {item.label}
            </Typography>
            <div className="flex flex-wrap items-baseline gap-sm">
              <div>{item.value}</div>
              {item.delta != null ? (
                <Typography
                  as="span"
                  variant="small"
                  className={cn(
                    item.deltaTone ? deltaToneClass[item.deltaTone] : 'text-neutral-600'
                  )}
                >
                  {item.delta}
                </Typography>
              ) : null}
            </div>
            {mode === 'expanded' && item.footnote ? (
              <Typography variant="caption" tone="muted" className="mt-xs">
                {item.footnote}
              </Typography>
            ) : null}
          </div>
        ))}
      </div>
    )
  }
)

FinancialKpiStrip.displayName = 'FinancialKpiStrip'
