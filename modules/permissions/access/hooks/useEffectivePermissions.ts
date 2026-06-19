'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EffectivePermissions } from '../model/permissions'
import * as accessApi from '../api/access.api'

export function useEffectivePermissions(orgId: string | null, projectId?: string) {
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const data = await accessApi.getEffectivePermissions(orgId, projectId)
      setPermissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const hasPermission = useCallback(
    (perm: string): boolean => {
      return permissions?.permissions.includes(perm) ?? false
    },
    [permissions]
  )

  return { permissions, loading, error, refetch: load, hasPermission }
}
