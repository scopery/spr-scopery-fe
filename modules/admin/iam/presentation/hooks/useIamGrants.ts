'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamGrantsApi } from '@/modules/auth/iam'
import type { IamGrant } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamGrants() {
  const [subjectId, setSubjectId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [items, setItems] = useState<IamGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iamGrantsApi.searchGrants({
        subjectId: subjectId.trim() || undefined,
        resourceId: resourceId.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load grants'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [subjectId, resourceId])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = useCallback(
    async (grantId: string) => {
      setActingId(grantId)
      try {
        await iamGrantsApi.revokeGrant(grantId)
        toast.success('Grant revoked')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActingId(null)
      }
    },
    [load]
  )

  return {
    items,
    loading,
    error,
    subjectId,
    setSubjectId,
    resourceId,
    setResourceId,
    actingId,
    refetch: load,
    revoke,
  }
}
