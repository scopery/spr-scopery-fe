'use client'

import { useCallback, useEffect, useState } from 'react'
import * as authorizationApi from '../api/authorization.api'
import type { AuthorizationCheckPayload, AuthorizationCheckResult } from '../model'

export function useAuthorizationCheck(
  check: AuthorizationCheckPayload | null,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled !== false && check != null
  const [result, setResult] = useState<AuthorizationCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!check) return
    setLoading(true)
    setError(null)
    try {
      const res = await authorizationApi.checkAuthorization(check)
      if (signal?.aborted) return
      setResult(res)
    } catch (err) {
      if (signal?.aborted) return
      setResult(null)
      setError(err instanceof Error ? err.message : 'Authorization check failed')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [
    check?.permissionCode,
    check?.actionCode,
    check?.resourceType,
    check?.resourceRefId,
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setResult(null)
      setError(null)
      return
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [enabled, load])

  return {
    result,
    allowed: result?.allowed === true,
    loading,
    error,
    refetch: load,
  }
}
