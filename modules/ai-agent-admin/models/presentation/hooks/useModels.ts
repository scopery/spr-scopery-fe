'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as modelsApi from '../../infrastructure/api/models.api'
import type { AiModel, SearchAiModelsParams } from '../../domain/model/ai-model'

export function useModels(params: SearchAiModelsParams) {
  const [items, setItems] = useState<AiModel[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await modelsApi.listModels(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load models')
    } finally {
      setLoading(false)
    }
  }, [params.providerId, params.keyword, params.status, params.type, params.page, params.size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useModelDetail(modelId: string | null) {
  const [model, setModel] = useState<AiModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!modelId) return
    setLoading(true)
    setError(null)
    try {
      setModel(await modelsApi.getModel(modelId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load model')
    } finally {
      setLoading(false)
    }
  }, [modelId])

  useEffect(() => {
    void load()
  }, [load])

  return { model, loading, error, refetch: load }
}
