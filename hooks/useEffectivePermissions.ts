'use client'

import { useCallback, useEffect, useState } from 'react'
import * as accessService from '@/services/access.service'
import type { EffectivePermissions } from '@/types/permissions'

export function useEffectivePermissions(orgId: string | null, projectId?: string) {
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const data = await accessService.getEffectivePermissions(orgId, projectId)
      setPermissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => { load() }, [load])

  const hasPermission = useCallback((perm: string): boolean => {
    return permissions?.permissions.includes(perm) ?? false
  }, [permissions])

  return { permissions, loading, error, refetch: load, hasPermission }
}
