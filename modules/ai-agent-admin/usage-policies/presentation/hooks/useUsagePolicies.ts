'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as usagePoliciesApi from '../../infrastructure/api/usage-policies.api'
import type {
  AiUsagePolicy,
  SearchAiUsagePoliciesParams,
} from '../../domain/model/usage-policy'

export function useUsagePolicies(params: SearchAiUsagePoliciesParams) {
  const [items, setItems] = useState<AiUsagePolicy[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await usagePoliciesApi.listUsagePolicies(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load usage policies')
    } finally {
      setLoading(false)
    }
  }, [params.keyword, params.targetType, params.status, params.page, params.size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useUsagePolicyDetail(policyId: string | null) {
  const [policy, setPolicy] = useState<AiUsagePolicy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!policyId) return
    setLoading(true)
    setError(null)
    try {
      setPolicy(await usagePoliciesApi.getUsagePolicy(policyId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load usage policy')
    } finally {
      setLoading(false)
    }
  }, [policyId])

  useEffect(() => {
    void load()
  }, [load])

  return { policy, loading, error, refetch: load }
}
