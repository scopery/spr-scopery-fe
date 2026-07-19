'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { iamUsersApi } from '@/modules/auth/iam'
import type { PersonIdentity } from '../../domain/model/person-identity'
import {
  formatPersonLabel,
  mapIamUserToPerson,
  shortUserId,
} from '../../domain/rules/person-identity.rules'

/** Cross-instance cache so lists don't re-fetch the same users. */
const globalPeopleCache = new Map<string, PersonIdentity>()
const globalFailedIds = new Set<string>()

function uniqIds(values: Array<string | null | undefined> = []): string[] {
  return [...new Set(values.map((v) => v?.trim()).filter(Boolean) as string[])]
}

/**
 * Resolve IAM users by id for display (name / email / avatar fallback).
 * Failed lookups are remembered so we don't hammer the API.
 */
export function useResolveUsers(userIds: Array<string | null | undefined>) {
  const [peopleById, setPeopleById] = useState<Record<string, PersonIdentity>>(() => {
    const initial: Record<string, PersonIdentity> = {}
    for (const id of uniqIds(userIds)) {
      const cached = globalPeopleCache.get(id)
      if (cached) initial[id] = cached
    }
    return initial
  })
  const failedRef = useRef(globalFailedIds)

  const ids = useMemo(() => uniqIds(userIds), [userIds.join('|')])
  const idsKey = ids.join('|')

  useEffect(() => {
    const missing = ids.filter(
      (id) => !globalPeopleCache.has(id) && !failedRef.current.has(id) && !peopleById[id]
    )
    if (!missing.length) {
      // Sync any newly cached globals into local state
      setPeopleById((prev) => {
        let changed = false
        const next = { ...prev }
        for (const id of ids) {
          const cached = globalPeopleCache.get(id)
          if (cached && !next[id]) {
            next[id] = cached
            changed = true
          }
        }
        return changed ? next : prev
      })
      return
    }
    let cancelled = false

    void (async () => {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const user = await iamUsersApi.getUser(id)
            return mapIamUserToPerson(user)
          } catch {
            return null
          }
        })
      )
      if (cancelled) return
      setPeopleById((prev) => {
        const next = { ...prev }
        results.forEach((person, index) => {
          const id = missing[index]!
          if (person) {
            globalPeopleCache.set(person.id, person)
            next[person.id] = person
            failedRef.current.delete(person.id)
          } else {
            failedRef.current.add(id)
          }
        })
        return next
      })
    })()

    return () => {
      cancelled = true
    }
  }, [idsKey, peopleById, ids])

  const labelFor = useCallback(
    (
      userId: string | null | undefined,
      opts?: { currentUserId?: string | null; youLabel?: string }
    ) => {
      if (!userId) return '—'
      const person = peopleById[userId] ?? globalPeopleCache.get(userId) ?? null
      return formatPersonLabel(person, userId, opts)
    },
    [peopleById]
  )

  const personFor = useCallback(
    (userId: string | null | undefined): PersonIdentity | null => {
      if (!userId) return null
      return peopleById[userId] ?? globalPeopleCache.get(userId) ?? null
    },
    [peopleById]
  )

  return {
    peopleById,
    labelFor,
    personFor,
    shortUserId,
    loadingIds: ids.filter(
      (id) => !peopleById[id] && !globalPeopleCache.has(id) && !failedRef.current.has(id)
    ),
  }
}
