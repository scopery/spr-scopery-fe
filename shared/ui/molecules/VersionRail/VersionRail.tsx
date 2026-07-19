'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { Badge } from '../../atoms/Badge'
import { Typography } from '../../atoms/Typography'
import type { VersionRailProps } from './VersionRail.types'

/**
 * VersionRail — vertical list of versions (quotes, plans, baselines).
 * Business lifecycle labels are passed as props — no domain imports.
 */
export const VersionRail = React.forwardRef<HTMLElement, VersionRailProps>(
  (
    {
      items,
      selectedId,
      onSelect,
      className,
      'aria-label': ariaLabel = 'Versions',
      actions,
    },
    ref
  ) => {
    return (
      <nav ref={ref} aria-label={ariaLabel} className={cn('flex flex-col gap-xs', className)}>
        <ul className="flex flex-col gap-xs" role="list">
          {items.map((item) => {
            const selected = selectedId != null ? selectedId === item.id : Boolean(item.current)
            const interactive = Boolean(onSelect) && !item.disabled

            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!interactive}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect?.(item.id)}
                  className={cn(
                    'flex w-full flex-col gap-xs border-l-2 px-sm py-sm text-left transition-colors',
                    selected
                      ? 'border-primary bg-neutral-50'
                      : 'border-transparent hover:bg-neutral-50',
                    item.disabled && 'cursor-not-allowed opacity-50',
                    !interactive && 'cursor-default'
                  )}
                >
                  <div className="flex items-center gap-sm">
                    <Typography
                      as="span"
                      variant="small"
                      weight={selected ? 'semibold' : 'medium'}
                      className="truncate"
                    >
                      {item.label}
                    </Typography>
                    {item.current ? (
                      <Badge size="sm" tone="primary" variant="soft">
                        Current
                      </Badge>
                    ) : null}
                    {item.statusLabel ? (
                      <Badge size="sm" tone={item.statusTone ?? 'neutral'} variant="soft">
                        {item.statusLabel}
                      </Badge>
                    ) : null}
                  </div>
                  {item.timestamp ? (
                    <Typography as="span" variant="caption" tone="muted">
                      {item.timestamp}
                    </Typography>
                  ) : null}
                  {item.meta ? <div className="mt-xs">{item.meta}</div> : null}
                </button>
              </li>
            )
          })}
        </ul>
        {actions ? <div className="mt-sm border-t border-neutral-200 pt-sm">{actions}</div> : null}
      </nav>
    )
  }
)

VersionRail.displayName = 'VersionRail'
