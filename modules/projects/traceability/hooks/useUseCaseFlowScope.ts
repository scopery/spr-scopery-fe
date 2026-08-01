'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as useCaseApi from '../api/use-case.api'
import type { UseCaseFlowScope, UseCaseMentionOption } from '../model/flow-mention'

const SCOPE_TTL_MS = 5 * 60 * 1000

type ScopeCacheEntry = { scope: UseCaseFlowScope; fetchedAt: number }

const scopeCache = new Map<string, ScopeCacheEntry>()

function cacheKey(projectId: string, useCaseId: string) {
  return `${projectId}:${useCaseId}`
}

export function invalidateUseCaseFlowScope(projectId: string, useCaseId: string) {
  scopeCache.delete(cacheKey(projectId, useCaseId))
}

export function useUseCaseFlowScope(projectId: string | null, useCaseId: string | null) {
  const [scope, setScope] = useState<UseCaseFlowScope | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!projectId || !useCaseId) {
        setScope(null)
        return null
      }
      const key = cacheKey(projectId, useCaseId)
      const cached = scopeCache.get(key)
      if (!opts?.force && cached && Date.now() - cached.fetchedAt < SCOPE_TTL_MS) {
        setScope(cached.scope)
        return cached.scope
      }

      const id = ++requestId.current
      setLoading(true)
      setError(null)
      try {
        const next = await useCaseApi.getFlowScope(projectId, useCaseId)
        if (id !== requestId.current) return null
        scopeCache.set(key, { scope: next, fetchedAt: Date.now() })
        setScope(next)
        return next
      } catch (err) {
        if (id !== requestId.current) return null
        setError(err instanceof Error ? err.message : 'Failed to load flow scope')
        setScope(null)
        return null
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [projectId, useCaseId]
  )

  useEffect(() => {
    void load()
  }, [load])

  const listMentionOptions = useCallback(
    async (params: {
      query?: string
      types?: string
      screenId?: string
      mode?: 'browse' | 'search'
      limit?: number
    }): Promise<UseCaseMentionOption[]> => {
      if (!projectId || !useCaseId) return []
      const res = await useCaseApi.getMentionOptions(projectId, useCaseId, params)
      return res.items
    },
    [projectId, useCaseId]
  )

  const hasFunction = Boolean(scope?.function)
  const hasScreens = (scope?.screens.length ?? 0) > 0

  return {
    scope,
    loading,
    error,
    hasFunction,
    hasScreens,
    refetch: () => load({ force: true }),
    listMentionOptions,
  }
}
