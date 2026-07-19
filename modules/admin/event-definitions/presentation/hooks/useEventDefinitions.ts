'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as eventDefinitionsApi from '../../infrastructure/api/event-definitions.api'
import type { EventDefinition, EventDefinitionVariable, SearchEventDefinitionsParams } from '../../domain/model/event-definition'

export function useEventDefinitions(params?: SearchEventDefinitionsParams) {
  const [items, setItems] = useState<EventDefinition[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await eventDefinitionsApi.searchEventDefinitions(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load event definitions')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useEventDefinitionVariables(eventDefinitionId: string | null) {
  const [items, setItems] = useState<EventDefinitionVariable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventDefinitionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await eventDefinitionsApi.listEventDefinitionVariables(eventDefinitionId)
      setItems(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load event definition variables')
    } finally {
      setLoading(false)
    }
  }, [eventDefinitionId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
