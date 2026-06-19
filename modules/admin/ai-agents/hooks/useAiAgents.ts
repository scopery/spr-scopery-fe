'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  AIAgentAdminSummary,
  AIAgentDetail,
  AIAgentListItem,
  AIAgentVersionDetail,
  AIModelSelectItem,
} from '@/modules/admin/ai-agents'
import * as aiAgentsApi from '../api/ai-agents.api'

export function useAiAgentsList() {
  const [summary, setSummary] = useState<AIAgentAdminSummary | null>(null)
  const [items, setItems] = useState<AIAgentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, listRes] = await Promise.all([
        aiAgentsApi.getAgentsSummary(),
        aiAgentsApi.listAgents(),
      ])
      setSummary(summaryRes)
      setItems(listRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { summary, items, loading, error, refetch: load }
}

export function useAiAgentDetail(agentId: string | null) {
  const [agent, setAgent] = useState<AIAgentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    setError(null)
    try {
      const data = await aiAgentsApi.getAgent(agentId)
      setAgent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    void load()
  }, [load])

  return { agent, loading, error, refetch: load }
}

export function useAiAgentVersion(agentId: string | null, versionId: string | null) {
  const [version, setVersion] = useState<AIAgentVersionDetail | null>(null)
  const [models, setModels] = useState<AIModelSelectItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!agentId || !versionId) return
    setLoading(true)
    setError(null)
    try {
      const [versionRes, modelsRes] = await Promise.all([
        aiAgentsApi.getAgentVersion(agentId, versionId),
        aiAgentsApi.listModels(),
      ])
      setVersion(versionRes)
      setModels(modelsRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent version')
    } finally {
      setLoading(false)
    }
  }, [agentId, versionId])

  useEffect(() => {
    void load()
  }, [load])

  return { version, models, loading, error, refetch: load }
}
