'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as capabilitiesApi from '../../infrastructure/api/capabilities.api'
import type {
  AiParameterCapability,
  SearchAiParameterCapabilitiesParams,
} from '../../domain/model/capability'

export function useParameterCapabilities(params: SearchAiParameterCapabilitiesParams) {
  const [items, setItems] = useState<AiParameterCapability[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await capabilitiesApi.listCapabilities(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load capabilities')
    } finally {
      setLoading(false)
    }
  }, [
    params.modelId,
    params.parameterName,
    params.supportStatus,
    params.valueType,
    params.status,
    params.page,
    params.size,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}
