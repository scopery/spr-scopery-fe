'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import type { FilterOption, FilterProps } from './Filter.types'

/**
 * Filter — segmented chip group for list filters (All / Active / …).
 * Default size matches Button/Input medium (h-9).
 */
export function Filter<T extends string = string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel = 'Filter',
  className,
}: FilterProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex flex-wrap items-center gap-2', className)}
    >
      {options.map((option: FilterOption<T>) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-9 items-center justify-center px-sm text-[13px] font-normal transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              selected
                ? 'bg-primary-gradient text-white'
                : 'border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-900 hover:text-white hover:border-neutral-900'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
