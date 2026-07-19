'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamResourcesApi } from '@/modules/auth/iam'
import type { IamResource } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamResourceDetail(resourceId: string | null) {
  const [resource, setResource] = useState<IamResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!resourceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await iamResourcesApi.getResource(resourceId)
      setResource(res)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load resource'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [resourceId])

  useEffect(() => {
    void load()
  }, [load])

  return { resource, loading, error, refetch: load }
}
