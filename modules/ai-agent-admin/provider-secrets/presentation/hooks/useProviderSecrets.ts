'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as secretsApi from '../../infrastructure/api/provider-secrets.api'
import type {
  AiProviderSecret,
  SearchAiProviderSecretsParams,
} from '../../domain/model/provider-secret'

export function useProviderSecrets(params: SearchAiProviderSecretsParams) {
  const [items, setItems] = useState<AiProviderSecret[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await secretsApi.listProviderSecrets(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load provider secrets')
    } finally {
      setLoading(false)
    }
  }, [params.providerId, params.secretType, params.status, params.page, params.size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useProviderSecretDetail(secretId: string | null) {
  const [secret, setSecret] = useState<AiProviderSecret | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!secretId) return
    setLoading(true)
    setError(null)
    try {
      const res = await secretsApi.getProviderSecret(secretId)
      setSecret(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load secret')
    } finally {
      setLoading(false)
    }
  }, [secretId])

  useEffect(() => {
    void load()
  }, [load])

  return { secret, loading, error, refetch: load }
}
