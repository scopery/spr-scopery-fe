'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as financeApi from '../../infrastructure/api/finance.api'
import type {
  CreateFinanceScenarioPayload,
  FinanceScenario,
  FinanceSummary,
} from '../../domain/model/finance'

export function useFinanceScenarios(projectId: string | null) {
  const [scenarios, setScenarios] = useState<FinanceScenario[]>([])
  const [currentScenario, setCurrentScenario] = useState<FinanceScenario | null>(null)
  const [currentSummary, setCurrentSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const list = await financeApi.listFinanceScenarios(projectId)
      setScenarios(list)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load finance scenarios')
      setScenarios([])
    } finally {
      setLoading(false)
    }

    try {
      const [current, summary] = await Promise.all([
        financeApi.getCurrentFinance(projectId),
        financeApi.getCurrentFinanceSummary(projectId),
      ])
      setCurrentScenario(current)
      setCurrentSummary(summary)
    } catch {
      setCurrentScenario(null)
      setCurrentSummary(null)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createScenario = useCallback(
    async (body: CreateFinanceScenarioPayload) => {
      if (!projectId) return null
      setCreating(true)
      try {
        const created = await financeApi.createFinanceScenario(projectId, body)
        await load()
        return created
      } finally {
        setCreating(false)
      }
    },
    [projectId, load]
  )

  const approveScenario = useCallback(
    async (scenarioId: string) => {
      if (!projectId) return null
      const result = await financeApi.approveFinanceScenario(projectId, scenarioId)
      await load()
      return result
    },
    [projectId, load]
  )

  const markCurrent = useCallback(
    async (scenarioId: string) => {
      if (!projectId) return null
      const result = await financeApi.markFinanceCurrent(projectId, scenarioId)
      await load()
      return result
    },
    [projectId, load]
  )

  const archiveScenario = useCallback(
    async (scenarioId: string) => {
      if (!projectId) return null
      const result = await financeApi.archiveFinanceScenario(projectId, scenarioId)
      await load()
      return result
    },
    [projectId, load]
  )

  const duplicateScenario = useCallback(
    async (scenarioId: string) => {
      if (!projectId) return null
      const result = await financeApi.duplicateFinanceScenario(projectId, scenarioId)
      await load()
      return result
    },
    [projectId, load]
  )

  return {
    scenarios,
    currentScenario,
    currentSummary,
    loading,
    creating,
    error,
    forbidden,
    refetch: load,
    createScenario,
    approveScenario,
    markCurrent,
    archiveScenario,
    duplicateScenario,
  }
}
