'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as agentsApi from '../../infrastructure/api/agents.api'
import type { AiAgent, SearchAiAgentsParams } from '../../domain/model/agent'

export function useAgents(params: SearchAiAgentsParams) {
  const [items, setItems] = useState<AiAgent[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await agentsApi.listAgents(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [params.keyword, params.type, params.status, params.outputFormat, params.page, params.size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useAgentDetail(agentId: string | null) {
  const [agent, setAgent] = useState<AiAgent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    setError(null)
    try {
      setAgent(await agentsApi.getAgent(agentId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load agent')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    void load()
  }, [load])

  return { agent, loading, error, refetch: load }
}
