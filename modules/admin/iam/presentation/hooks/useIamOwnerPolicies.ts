'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamOwnerPoliciesApi } from '@/modules/auth/iam'
import type { IamOwnerPolicy } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

function normalizeOwnerPoliciesResponse(
  value: unknown
) {
  if (Array.isArray(value)) return value as IamOwnerPolicy[]
  if (
    value &&
    typeof value === 'object' &&
    'items' in value &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    return (value as { items: IamOwnerPolicy[] }).items
  }
  return null
}

export function useIamOwnerPolicies() {
  const [items, setItems] = useState<IamOwnerPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iamOwnerPoliciesApi.listOwnerPolicies({ page: 0, size: 50 })
      const normalizedItems = normalizeOwnerPoliciesResponse(res)

      if (!normalizedItems) {
        setItems([])
        setError('Unexpected owner policies response')
        return
      }

      setItems(normalizedItems)
    } catch (err) {
      setItems([])
      const msg = err instanceof Error ? err.message : 'Failed to load owner policies'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
