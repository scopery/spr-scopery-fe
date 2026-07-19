'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as deploymentsApi from '../../infrastructure/api/deployments.api'
import type {
  AiModelDeployment,
  SearchAiModelDeploymentsParams,
} from '../../domain/model/deployment'

export function useDeployments(params: SearchAiModelDeploymentsParams) {
  const [items, setItems] = useState<AiModelDeployment[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await deploymentsApi.listDeployments(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load deployments')
    } finally {
      setLoading(false)
    }
  }, [
    params.modelId,
    params.environment,
    params.keyword,
    params.status,
    params.isDefault,
    params.page,
    params.size,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useDeploymentDetail(deploymentId: string | null) {
  const [deployment, setDeployment] = useState<AiModelDeployment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!deploymentId) return
    setLoading(true)
    setError(null)
    try {
      setDeployment(await deploymentsApi.getDeployment(deploymentId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load deployment')
    } finally {
      setLoading(false)
    }
  }, [deploymentId])

  useEffect(() => {
    void load()
  }, [load])

  return { deployment, loading, error, refetch: load }
}
