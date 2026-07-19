'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authorizationApi from '../api/authorization.api'
import {
  authorizationKey,
  toAuthorizationAllowedMap,
} from '../lib/authorization-key'
import type { AuthorizationCheckPayload, AuthorizationCheckResult } from '../model'

function checksFingerprint(checks: AuthorizationCheckPayload[]): string {
  return checks
    .map(
      (c) =>
        `${c.permissionCode}:${c.actionCode}:${c.resourceType}:${c.resourceRefId ?? ''}`
    )
    .join('|')
}

export function useAuthorizationBatch(
  checks: AuthorizationCheckPayload[],
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled !== false && checks.length > 0
  const fingerprint = checksFingerprint(checks)
  const [results, setResults] = useState<AuthorizationCheckResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!checks.length) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await authorizationApi.checkAuthorizationBatch({ checks })
      if (signal?.aborted) return
      setResults(res)
    } catch (err) {
      if (signal?.aborted) return
      setResults([])
      setError(err instanceof Error ? err.message : 'Authorization batch failed')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [fingerprint]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setResults([])
      setError(null)
      return
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [enabled, load])

  const allowedMap = useMemo(() => toAuthorizationAllowedMap(results), [results])

  const isAllowed = useCallback(
    (permissionCode: string, actionCode: string) =>
      allowedMap[authorizationKey(permissionCode, actionCode)] === true,
    [allowedMap]
  )

  const anyAllowed = useMemo(() => results.some((r) => r.allowed), [results])

  return {
    results,
    allowedMap,
    isAllowed,
    anyAllowed,
    loading,
    error,
    refetch: load,
  }
}
