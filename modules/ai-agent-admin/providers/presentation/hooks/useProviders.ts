'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as providersApi from '../../infrastructure/api/providers.api'
import type { AiProvider, SearchAiProvidersParams } from '../../domain/model/provider'

export function useProviders(params: SearchAiProvidersParams) {
  const [items, setItems] = useState<AiProvider[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await providersApi.listProviders(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }, [
    params.keyword,
    params.type,
    params.status,
    params.page,
    params.size,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useProviderDetail(providerId: string | null) {
  const [provider, setProvider] = useState<AiProvider | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    setError(null)
    try {
      const res = await providersApi.getProvider(providerId)
      setProvider(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load provider')
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    void load()
  }, [load])

  return { provider, loading, error, refetch: load }
}
