'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as executionsApi from '../../infrastructure/api/executions.api'
import type {
  AiExecutionRunResult,
  ExecuteByEventConfigPayload,
  ExecuteByEventPayload,
} from '../../domain/model/execution'

export function useExecutionTriggers() {
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<AiExecutionRunResult | null>(null)

  const runByEvent = useCallback(async (body: ExecuteByEventPayload) => {
    setRunning(true)
    try {
      const result = await executionsApi.executeByEvent(body)
      setLastResult(result)
      toast.success(`Execution ${result.status}`)
      return result
    } finally {
      setRunning(false)
    }
  }, [])

  const runByEventConfig = useCallback(
    async (eventConfigId: string, body?: ExecuteByEventConfigPayload) => {
      setRunning(true)
      try {
        const result = await executionsApi.executeByEventConfig(eventConfigId, body)
        setLastResult(result)
        toast.success(`Execution ${result.status}`)
        return result
      } finally {
        setRunning(false)
      }
    },
    []
  )

  return { running, lastResult, runByEvent, runByEventConfig, setLastResult }
}
