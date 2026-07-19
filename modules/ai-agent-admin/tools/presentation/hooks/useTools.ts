'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as toolsApi from '../../infrastructure/api/tools.api'
import type {
  AiTool,
  AiToolAgentBinding,
  SearchAiToolsParams,
} from '../../domain/model/tool'

export function useTools(params: SearchAiToolsParams) {
  const [items, setItems] = useState<AiTool[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await toolsApi.listTools(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tools')
    } finally {
      setLoading(false)
    }
  }, [params.q, params.category, params.status, params.page, params.size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useToolDetail(toolId: string | null) {
  const [tool, setTool] = useState<AiTool | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!toolId) return
    setLoading(true)
    setError(null)
    try {
      setTool(await toolsApi.getTool(toolId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tool')
    } finally {
      setLoading(false)
    }
  }, [toolId])

  useEffect(() => {
    void load()
  }, [load])

  return { tool, loading, error, refetch: load }
}

export function useToolBindings(toolId: string | null, enabled = true) {
  const [bindings, setBindings] = useState<AiToolAgentBinding[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!toolId || !enabled) return
    setLoading(true)
    setError(null)
    try {
      setBindings(await toolsApi.listToolBindings(toolId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bindings')
    } finally {
      setLoading(false)
    }
  }, [toolId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { bindings, loading, error, refetch: load }
}
