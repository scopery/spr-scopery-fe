'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as eventConfigsApi from '../../infrastructure/api/event-configs.api'
import type {
  AiEventConfig,
  ResolveEventConfigParams,
  SearchAiEventConfigsParams,
} from '../../domain/model/event-config'

export function useEventConfigs(params: SearchAiEventConfigsParams) {
  const [items, setItems] = useState<AiEventConfig[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await eventConfigsApi.listEventConfigs(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load event configs')
    } finally {
      setLoading(false)
    }
  }, [
    params.keyword,
    params.eventDefinitionId,
    params.environment,
    params.triggerType,
    params.status,
    params.agentId,
    params.page,
    params.size,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useEventConfigDetail(eventConfigId: string | null) {
  const [config, setConfig] = useState<AiEventConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventConfigId) return
    setLoading(true)
    setError(null)
    try {
      setConfig(await eventConfigsApi.getEventConfig(eventConfigId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load event config')
    } finally {
      setLoading(false)
    }
  }, [eventConfigId])

  useEffect(() => {
    void load()
  }, [load])

  return { config, loading, error, refetch: load }
}

export function useResolveEventConfig() {
  const [result, setResult] = useState<AiEventConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolve = useCallback(async (params: ResolveEventConfigParams) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await eventConfigsApi.resolveEventConfig(params)
      setResult(res)
      return res
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Resolve failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, resolve, clear }
}
