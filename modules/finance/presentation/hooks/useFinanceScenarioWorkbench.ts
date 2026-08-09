'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as financeApi from '../../infrastructure/api/finance.api'
import type {
  CreateCustomCostPayload,
  CreateVendorCostPayload,
  CustomCost,
  FinanceScenario,
  FinanceSummary,
  PhaseFinance,
  UpdatePhaseRevenuePayload,
  VendorCost,
} from '../../domain/model/finance'

export type FinanceWorkbenchTab = 'phases' | 'custom' | 'vendor' | 'assumptions'

export function useFinanceScenarioWorkbench(
  projectId: string | null,
  scenarioId: string | null
) {
  const [tab, setTab] = useState<FinanceWorkbenchTab>('phases')
  const [scenario, setScenario] = useState<FinanceScenario | null>(null)
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [phases, setPhases] = useState<PhaseFinance[]>([])
  const [customCosts, setCustomCosts] = useState<CustomCost[]>([])
  const [vendorCosts, setVendorCosts] = useState<VendorCost[]>([])
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !scenarioId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      // Scenario must exist for the workbench to render
      const sc = await financeApi.getFinanceScenario(projectId, scenarioId)
      setScenario(sc)
      // Secondary data: failures mean "not yet calculated" — render page without them
      const [sum, ph, custom, vendor] = await Promise.all([
        financeApi.getFinanceSummary(projectId, scenarioId),
        financeApi.listPhaseFinances(projectId, scenarioId).catch((): PhaseFinance[] => []),
        financeApi.listCustomCosts(projectId, scenarioId).catch((): CustomCost[] => []),
        financeApi.listVendorCosts(projectId, scenarioId).catch((): VendorCost[] => []),
      ])
      setSummary(sum)
      setPhases(ph)
      setCustomCosts(custom)
      setVendorCosts(vendor)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load finance scenario')
      setScenario(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, scenarioId])

  useEffect(() => {
    void load()
  }, [load])

  const recalculate = useCallback(async () => {
    if (!projectId || !scenarioId) return null
    setRecalculating(true)
    try {
      const result = await financeApi.recalculateFinanceScenario(projectId, scenarioId)
      await load()
      return result
    } finally {
      setRecalculating(false)
    }
  }, [projectId, scenarioId, load])

  const approve = useCallback(async () => {
    if (!projectId || !scenarioId) return null
    const result = await financeApi.approveFinanceScenario(projectId, scenarioId)
    await load()
    return result
  }, [projectId, scenarioId, load])

  const markCurrent = useCallback(async () => {
    if (!projectId || !scenarioId) return null
    const result = await financeApi.markFinanceCurrent(projectId, scenarioId)
    await load()
    return result
  }, [projectId, scenarioId, load])

  const archive = useCallback(async () => {
    if (!projectId || !scenarioId) return null
    const result = await financeApi.archiveFinanceScenario(projectId, scenarioId)
    await load()
    return result
  }, [projectId, scenarioId, load])

  const updatePhaseRevenue = useCallback(
    async (phaseFinanceId: string, body: UpdatePhaseRevenuePayload) => {
      if (!projectId || !scenarioId) return null
      const result = await financeApi.updatePhaseRevenue(
        projectId,
        scenarioId,
        phaseFinanceId,
        body
      )
      await load()
      return result
    },
    [projectId, scenarioId, load]
  )

  const addCustomCost = useCallback(
    async (body: CreateCustomCostPayload) => {
      if (!projectId || !scenarioId) return null
      const result = await financeApi.createCustomCost(projectId, scenarioId, body)
      await load()
      return result
    },
    [projectId, scenarioId, load]
  )

  const archiveCustom = useCallback(
    async (costId: string) => {
      if (!projectId || !scenarioId) return null
      const result = await financeApi.archiveCustomCost(projectId, scenarioId, costId)
      await load()
      return result
    },
    [projectId, scenarioId, load]
  )

  const addVendorCost = useCallback(
    async (body: CreateVendorCostPayload) => {
      if (!projectId || !scenarioId) return null
      const result = await financeApi.createVendorCost(projectId, scenarioId, body)
      await load()
      return result
    },
    [projectId, scenarioId, load]
  )

  const archiveVendor = useCallback(
    async (costId: string) => {
      if (!projectId || !scenarioId) return null
      const result = await financeApi.archiveVendorCost(projectId, scenarioId, costId)
      await load()
      return result
    },
    [projectId, scenarioId, load]
  )

  return {
    tab,
    setTab,
    scenario,
    summary,
    phases,
    customCosts,
    vendorCosts,
    loading,
    recalculating,
    error,
    forbidden,
    refetch: load,
    recalculate,
    approve,
    markCurrent,
    archive,
    updatePhaseRevenue,
    addCustomCost,
    archiveCustom,
    addVendorCost,
    archiveVendor,
  }
}
