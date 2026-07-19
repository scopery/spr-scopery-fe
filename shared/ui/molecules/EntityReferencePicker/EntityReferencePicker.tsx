'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { Input } from '../../atoms/Input'
import { Typography } from '../../atoms/Typography'
import type {
  EntityReferenceOption,
  EntityReferencePickerProps,
} from './EntityReferencePicker.types'

/**
 * EntityReferencePicker — pick by type/code/title; never free-form UUID entry.
 */
export function EntityReferencePicker({
  options,
  value,
  onChange,
  placeholder = 'Search by name or code…',
  disabled,
  loading,
  emptyLabel = 'No matches',
  className,
  'aria-label': ariaLabel = 'Entity reference',
}: EntityReferencePickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 50)
    return options
      .filter((o) => {
        const hay = `${o.title} ${o.code ?? ''} ${o.type}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 50)
  }, [options, query])

  return (
    <div className={cn('flex flex-col gap-xs', className)}>
      {value ? (
        <div className="flex items-center justify-between gap-sm border border-neutral-200 bg-neutral-50 px-sm py-xs">
          <div>
            <Typography variant="small" weight="medium">
              {value.title}
            </Typography>
            <Typography variant="caption" tone="muted">
              {[value.type, value.code, value.status].filter(Boolean).join(' · ')}
            </Typography>
          </div>
          {!disabled ? (
            <button
              type="button"
              className="text-xs text-neutral-600 underline"
              onClick={() => onChange?.(null)}
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || loading}
        aria-label={`${ariaLabel} search`}
      />

      {!value ? (
        <ul
          role="listbox"
          aria-label={`${ariaLabel} results`}
          className="max-h-48 overflow-auto border border-neutral-200"
        >
          {loading ? (
            <li className="p-sm">
              <Typography variant="caption" tone="muted">
                Loading…
              </Typography>
            </li>
          ) : filtered.length === 0 ? (
            <li className="p-sm">
              <Typography variant="caption" tone="muted">
                {emptyLabel}
              </Typography>
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={`${opt.type}:${opt.id}`}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full flex-col items-start gap-xs px-sm py-xs text-left hover:bg-neutral-50"
                  onClick={() => {
                    onChange?.(opt)
                    setQuery('')
                  }}
                  disabled={disabled}
                >
                  <Typography variant="small" weight="medium">
                    {opt.title}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {[opt.type, opt.code, opt.scopeLabel, opt.status].filter(Boolean).join(' · ')}
                  </Typography>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

EntityReferencePicker.displayName = 'EntityReferencePicker'

export type { EntityReferenceOption }
