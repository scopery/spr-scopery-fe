'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as executionsApi from '../../infrastructure/api/executions.api'
import type {
  AiExecutionLog,
  SearchAiExecutionLogsParams,
} from '../../domain/model/execution'

export function useExecutionLogs(params: SearchAiExecutionLogsParams) {
  const [items, setItems] = useState<AiExecutionLog[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await executionsApi.listExecutionLogs(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load execution logs')
    } finally {
      setLoading(false)
    }
  }, [
    params.requestId,
    params.eventConfigId,
    params.eventDefinitionId,
    params.agentId,
    params.promptVersionId,
    params.modelDeploymentId,
    params.triggerSource,
    params.status,
    params.createdFrom,
    params.createdTo,
    params.page,
    params.size,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useExecutionLogDetail(logId: string | null) {
  const [log, setLog] = useState<AiExecutionLog | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!logId) return
    setLoading(true)
    setError(null)
    try {
      setLog(await executionsApi.getExecutionLog(logId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load execution log')
    } finally {
      setLoading(false)
    }
  }, [logId])

  useEffect(() => {
    void load()
  }, [load])

  return { log, loading, error, refetch: load }
}
