'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as financeApi from '../../infrastructure/api/finance.api'
import type { FinanceCompareResult, FinanceScenario } from '../../domain/model/finance'

export function useFinanceCompare(projectId: string | null) {
  const [scenarios, setScenarios] = useState<FinanceScenario[]>([])
  const [leftScenarioId, setLeftScenarioId] = useState('')
  const [rightScenarioId, setRightScenarioId] = useState('')
  const [result, setResult] = useState<FinanceCompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void financeApi
      .listFinanceScenarios(projectId)
      .then((list) => {
        if (cancelled) return
        setScenarios(list)
        setLeftScenarioId((prev) => prev || list[0]?.id || '')
        setRightScenarioId((prev) => prev || list[1]?.id || list[0]?.id || '')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load scenarios')
        setScenarios([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  const compare = useCallback(async () => {
    if (!projectId || !leftScenarioId || !rightScenarioId) return null
    if (leftScenarioId === rightScenarioId) {
      setError('Select two different scenarios')
      return null
    }
    setComparing(true)
    setError(null)
    try {
      const res = await financeApi.compareFinanceScenarios(
        projectId,
        leftScenarioId,
        rightScenarioId
      )
      setResult(res)
      return res
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError(err instanceof Error ? err.message : 'Compare failed')
      setResult(null)
      return null
    } finally {
      setComparing(false)
    }
  }, [projectId, leftScenarioId, rightScenarioId])

  return {
    scenarios,
    leftScenarioId,
    setLeftScenarioId,
    rightScenarioId,
    setRightScenarioId,
    result,
    loading,
    comparing,
    error,
    compare,
  }
}
