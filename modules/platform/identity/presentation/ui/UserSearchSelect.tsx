'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Input, Typography } from '@/shared/ui'
import { iamUsersApi } from '@/modules/auth/iam'
import { useDebounce } from '@/utils/useDebounce'
import { cn } from '@/utils/cn'
import { useFixedAnchorRect } from '@/shared/ui/atoms/SearchableSelect/useFixedAnchorRect'
import type { PersonIdentity } from '../../domain/model/person-identity'
import { mapIamUserToPerson } from '../../domain/rules/person-identity.rules'
import { UserIdentity } from './UserIdentity'

interface UserSearchSelectProps {
  value: string
  onChange: (userId: string, person?: PersonIdentity) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  /** Seed people (e.g. already-loaded workspace members). */
  seedPeople?: PersonIdentity[]
  /** Set false to restrict selection to seedPeople (e.g. project/workspace members). */
  allowRemoteSearch?: boolean
}

/**
 * Searchable user picker — replaces free-text UUID inputs.
 */
export function UserSearchSelect({
  value,
  onChange,
  placeholder = 'Search by name or email…',
  disabled,
  label,
  seedPeople = [],
  allowRemoteSearch = true,
}: UserSearchSelectProps) {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const [results, setResults] = useState<PersonIdentity[]>(seedPeople)
  const [selected, setSelected] = useState<PersonIdentity | null>(null)
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const pos = useFixedAnchorRect(open, triggerRef)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const t = event.target as Node
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!seedPeople.length) return
    setResults((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]))
      for (const p of seedPeople) map.set(p.id, p)
      return [...map.values()]
    })
  }, [seedPeople])

  useEffect(() => {
    if (!value) {
      setSelected(null)
      return
    }
    const fromSeed = seedPeople.find((p) => p.id === value)
    const fromResults = results.find((p) => p.id === value)
    if (fromSeed || fromResults) {
      setSelected(fromSeed ?? fromResults ?? null)
      return
    }
    let cancelled = false
    void iamUsersApi
      .getUser(value)
      .then((u) => {
        if (!cancelled) setSelected(mapIamUserToPerson(u))
      })
      .catch(() => {
        if (!cancelled) setSelected(null)
      })
    return () => {
      cancelled = true
    }
  }, [value, seedPeople, results])

  const runSearch = useCallback(async (keyword: string) => {
    if (keyword.trim().length < 2) return
    setSearching(true)
    try {
      const res = await iamUsersApi.searchUsers({
        keyword: keyword.trim(),
        page: 0,
        size: 20,
      })
      setResults((res.items ?? []).map(mapIamUserToPerson))
    } catch {
      /* keep previous */
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!allowRemoteSearch || debounced.trim().length < 2) return
    void runSearch(debounced)
  }, [allowRemoteSearch, debounced, runSearch])

  const visibleResults = useMemo(() => {
    const people = new Map<string, PersonIdentity>()
    seedPeople.forEach((person) => people.set(person.id, person))
    results.forEach((person) => people.set(person.id, person))
    const normalized = query.trim().toLowerCase()
    if (!normalized) return [...people.values()]
    return [...people.values()].filter((person) =>
      [person.fullName, person.email, person.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    )
  }, [query, results, seedPeople])

  return (
    <div ref={rootRef} className="relative space-y-2">
      {label ? (
        <Typography variant="small">
          {label}
        </Typography>
      ) : null}

      {value && selected ? (
        <div className="flex h-9 items-center justify-between gap-2 border border-neutral-300 bg-white px-2">
          <div className="flex min-w-0 items-center gap-2">
            <UserIdentity userId={value} person={selected} size="xs" compact />
            {selected.email ? (
              <Typography
                variant="caption"
                tone="muted"
                className="min-w-0 truncate"
                title={selected.email}
              >
                ({selected.email})
              </Typography>
            ) : null}
          </div>
          <button
            type="button"
            className="text-xs text-neutral-500 hover:text-neutral-800"
            disabled={disabled}
            onClick={() => {
              onChange('')
              setSelected(null)
              setQuery('')
              setOpen(false)
            }}
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <div ref={triggerRef}>
            <Input
              fullWidth
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setOpen(false)
              }}
              placeholder={placeholder}
              disabled={disabled}
              aria-label={label ?? 'Search users'}
            />
          </div>
          {open && searching ? (
            <Typography variant="caption" tone="muted">
              Searching…
            </Typography>
          ) : null}
          {open &&
          typeof document !== 'undefined' &&
          (visibleResults.length > 0 || (query.trim().length >= 2 && !searching))
            ? createPortal(
                <div
                  ref={listRef}
                  style={{
                    top: pos?.top ?? 0,
                    left: pos?.left ?? 0,
                    width: pos?.width ?? 0,
                    maxHeight: pos?.maxHeight ?? 256,
                    visibility: pos ? 'visible' : 'hidden',
                  }}
                  className="fixed z-[200] overflow-auto border border-neutral-200 bg-white shadow-md"
                >
                  {visibleResults.length > 0 ? (
                    <ul>
                      {visibleResults.map((person) => (
                        <li key={person.id}>
                          <button
                            type="button"
                            disabled={disabled}
                            className={cn(
                              'flex w-full items-center px-3 py-2 text-left hover:bg-neutral-50',
                              value === person.id && 'bg-primary-50'
                            )}
                            onClick={() => {
                              onChange(person.id, person)
                              setSelected(person)
                              setQuery('')
                              setOpen(false)
                            }}
                          >
                            <UserIdentity userId={person.id} person={person} showEmail size="sm" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : query.trim().length >= 2 && !searching ? (
                    <Typography variant="small" tone="muted" className="px-3 py-2">
                      No users found.
                    </Typography>
                  ) : null}
                </div>,
                document.body
              )
            : null}
        </>
      )}
    </div>
  )
}
