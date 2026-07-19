'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input, Typography } from '@/shared/ui'
import { iamUsersApi } from '@/modules/auth/iam'
import { useDebounce } from '@/utils/useDebounce'
import { cn } from '@/utils/cn'
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
}: UserSearchSelectProps) {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const [results, setResults] = useState<PersonIdentity[]>(seedPeople)
  const [selected, setSelected] = useState<PersonIdentity | null>(null)
  const [searching, setSearching] = useState(false)

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
    if (debounced.trim().length < 2) return
    void runSearch(debounced)
  }, [debounced, runSearch])

  return (
    <div className="space-y-2">
      {label ? (
        <Typography variant="small" weight="medium">
          {label}
        </Typography>
      ) : null}

      {value && selected ? (
        <div className="flex items-center justify-between gap-2 border border-neutral-200 bg-neutral-50 px-3 py-2">
          <UserIdentity userId={value} person={selected} showEmail size="sm" />
          <button
            type="button"
            className="text-xs text-neutral-500 hover:text-neutral-800"
            disabled={disabled}
            onClick={() => {
              onChange('')
              setSelected(null)
              setQuery('')
            }}
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <Input
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={label ?? 'Search users'}
          />
          <Typography variant="caption" tone="muted">
            {searching ? 'Searching…' : 'Type at least 2 characters to search.'}
          </Typography>
          {results.length > 0 ? (
            <ul className="max-h-48 overflow-auto border border-neutral-200 bg-white">
              {results.map((person) => (
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
                    }}
                  >
                    <UserIdentity userId={person.id} person={person} showEmail size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {query.trim().length >= 2 && !searching && results.length === 0 ? (
            <Typography variant="small" tone="muted">
              No users found.
            </Typography>
          ) : null}
        </>
      )}
    </div>
  )
}
