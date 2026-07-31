'use client'

import { useMemo, useState } from 'react'
import { Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { PersonIdentity } from '../../domain/model/person-identity'
import { UserIdentity } from './UserIdentity'

export interface PersonReferenceOption {
  value: string
  person: PersonIdentity
  disabled?: boolean
}

export interface PersonReferenceSelectProps {
  value: string
  options: PersonReferenceOption[]
  onChange: (value: string, person?: PersonIdentity) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
}

/**
 * Local person picker whose submitted value may differ from userId.
 *
 * Use for workspace-member/resource IDs while consistently rendering the
 * associated user's avatar, name, and email.
 */
export function PersonReferenceSelect({
  value,
  options,
  onChange,
  label,
  placeholder = 'Search by name or email…',
  disabled,
  allowClear = true,
}: PersonReferenceSelectProps) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter(({ person }) =>
      [person.fullName, person.email, person.username]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalized))
    )
  }, [options, query])

  return (
    <div className="space-y-2">
      {label ? (
        <Typography variant="small" weight="medium">
          {label}
        </Typography>
      ) : null}
      {selected && !editing ? (
        <div className="flex items-center justify-between gap-2 border border-neutral-200 bg-neutral-50 px-3 py-2">
          <UserIdentity userId={selected.person.id} person={selected.person} showEmail size="sm" />
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs text-neutral-500 hover:text-neutral-800"
              disabled={disabled}
              onClick={() => setEditing(true)}
            >
              Change
            </button>
            {allowClear ? (
              <button
                type="button"
                className="text-xs text-neutral-500 hover:text-neutral-800"
                disabled={disabled}
                onClick={() => onChange('')}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <Input
            fullWidth
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={label ?? 'Search people'}
          />
          <ul className="max-h-48 overflow-auto border border-neutral-200 bg-white">
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={disabled || option.disabled}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-left hover:bg-neutral-50',
                    option.disabled && 'cursor-not-allowed opacity-50'
                  )}
                  onClick={() => {
                    onChange(option.value, option.person)
                    setQuery('')
                    setEditing(false)
                  }}
                >
                  <UserIdentity
                    userId={option.person.id}
                    person={option.person}
                    showEmail
                    size="sm"
                  />
                </button>
              </li>
            ))}
          </ul>
          {filtered.length === 0 ? (
            <Typography variant="small" tone="muted">
              No matching people.
            </Typography>
          ) : null}
        </>
      )}
    </div>
  )
}
