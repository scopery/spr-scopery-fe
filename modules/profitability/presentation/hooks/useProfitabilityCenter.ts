'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as profitabilityApi from '../../infrastructure/api/profitability.api'
import type {
  CostForecast,
  CostSource,
  CreateCostForecastPayload,
  CreateCostSourcePayload,
  CreateProfitAdjustmentPayload,
  CreateProfitabilityPlanPayload,
  CreateProfitRiskFlagPayload,
  CreateProfitVariancePayload,
  CreateRevenueForecastPayload,
  CreateRevenueSourcePayload,
  ProfitAdjustment,
  ProfitabilityPlan,
  ProfitabilityPlanVersion,
  ProfitabilityProfile,
  ProfitabilitySummary,
  ProfitRateCard,
  ProfitRiskFlag,
  ProfitThresholdPolicy,
  ProfitVariance,
  RevenueForecast,
  RevenueSource,
} from '../../domain/model/profitability'

export type ProfitabilityTab =
  | 'overview'
  | 'sources'
  | 'forecasts'
  | 'plans'
  | 'adjustments'
  | 'variance'
  | 'risks'
  | 'rateCards'
  | 'settings'

export function useProfitabilityCenter(projectId: string | null) {
  const [tab, setTab] = useState<ProfitabilityTab>('overview')
  const [profile, setProfile] = useState<ProfitabilityProfile | null>(null)
  const [summary, setSummary] = useState<ProfitabilitySummary | null>(null)
  const [costSources, setCostSources] = useState<CostSource[]>([])
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([])
  const [costForecasts, setCostForecasts] = useState<CostForecast[]>([])
  const [revenueForecasts, setRevenueForecasts] = useState<RevenueForecast[]>([])
  const [plans, setPlans] = useState<ProfitabilityPlan[]>([])
  const [planVersions, setPlanVersions] = useState<ProfitabilityPlanVersion[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [adjustments, setAdjustments] = useState<ProfitAdjustment[]>([])
  const [variances, setVariances] = useState<ProfitVariance[]>([])
  const [riskFlags, setRiskFlags] = useState<ProfitRiskFlag[]>([])
  const [rateCards, setRateCards] = useState<ProfitRateCard[]>([])
  const [threshold, setThreshold] = useState<ProfitThresholdPolicy | null>(null)
  const [loading, setLoading] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const loadCore = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [prof, sum] = await Promise.all([
        profitabilityApi.getProfitabilityProfile(projectId),
        profitabilityApi.getProfitabilitySummary(projectId),
      ])
      setProfile(prof)
      setSummary(sum)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load profitability')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadCore()
  }, [loadCore])

  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    const run = async () => {
      try {
        if (tab === 'overview' || tab === 'sources') {
          const [cs, rs, risks] = await Promise.all([
            profitabilityApi.listCostSources(projectId),
            profitabilityApi.listRevenueSources(projectId),
            profitabilityApi.listRiskFlags(projectId),
          ])
          if (cancelled) return
          setCostSources(cs)
          setRevenueSources(rs)
          setRiskFlags(risks)
        }
        if (tab === 'forecasts') {
          const [cf, rf] = await Promise.all([
            profitabilityApi.listCostForecasts(projectId),
            profitabilityApi.listRevenueForecasts(projectId),
          ])
          if (cancelled) return
          setCostForecasts(cf)
          setRevenueForecasts(rf)
        }
        if (tab === 'plans') {
          const list = await profitabilityApi.listProfitabilityPlans(projectId)
          if (cancelled) return
          setPlans(list)
          if (list[0] && !selectedPlanId) setSelectedPlanId(list[0].id)
        }
        if (tab === 'adjustments') {
          const list = await profitabilityApi.listAdjustments(projectId)
          if (cancelled) return
          setAdjustments(list)
        }
        if (tab === 'variance') {
          const list = await profitabilityApi.listVariances(projectId)
          if (cancelled) return
          setVariances(list)
        }
        if (tab === 'risks') {
          const list = await profitabilityApi.listRiskFlags(projectId)
          if (cancelled) return
          setRiskFlags(list)
        }
        if (tab === 'rateCards') {
          const list = await profitabilityApi.listProjectRateCards(projectId)
          if (cancelled) return
          setRateCards(list)
        }
        if (tab === 'settings') {
          const policy = await profitabilityApi.getThresholdPolicy(projectId)
          if (cancelled) return
          setThreshold(policy)
        }
      } catch {
        // tab-level errors shown via empty state; core error already set
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [projectId, tab, selectedPlanId])

  useEffect(() => {
    if (!projectId || !selectedPlanId || tab !== 'plans') return
    void profitabilityApi
      .listPlanVersions(projectId, selectedPlanId)
      .then(setPlanVersions)
      .catch(() => setPlanVersions([]))
  }, [projectId, selectedPlanId, tab])

  const initProfile = useCallback(
    async (currency: string) => {
      if (!projectId) return null
      const created = await profitabilityApi.createProfitabilityProfile(projectId, {
        currency,
      })
      await loadCore()
      return created
    },
    [projectId, loadCore]
  )

  const rebuild = useCallback(async () => {
    if (!projectId) return null
    setRebuilding(true)
    try {
      const sum = await profitabilityApi.rebuildProfitabilitySummary(projectId)
      setSummary(sum)
      return sum
    } finally {
      setRebuilding(false)
    }
  }, [projectId])

  const addCostSource = useCallback(
    async (body: CreateCostSourcePayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createCostSource(projectId, body)
      setCostSources(await profitabilityApi.listCostSources(projectId))
      return r
    },
    [projectId]
  )

  const archiveCost = useCallback(
    async (id: string) => {
      if (!projectId) return null
      const r = await profitabilityApi.archiveCostSource(projectId, id)
      setCostSources(await profitabilityApi.listCostSources(projectId))
      return r
    },
    [projectId]
  )

  const addRevenueSource = useCallback(
    async (body: CreateRevenueSourcePayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createRevenueSource(projectId, body)
      setRevenueSources(await profitabilityApi.listRevenueSources(projectId))
      return r
    },
    [projectId]
  )

  const archiveRevenue = useCallback(
    async (id: string) => {
      if (!projectId) return null
      const r = await profitabilityApi.archiveRevenueSource(projectId, id)
      setRevenueSources(await profitabilityApi.listRevenueSources(projectId))
      return r
    },
    [projectId]
  )

  const addCostForecast = useCallback(
    async (body: CreateCostForecastPayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createCostForecast(projectId, body)
      setCostForecasts(await profitabilityApi.listCostForecasts(projectId))
      return r
    },
    [projectId]
  )

  const addRevenueForecast = useCallback(
    async (body: CreateRevenueForecastPayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createRevenueForecast(projectId, body)
      setRevenueForecasts(await profitabilityApi.listRevenueForecasts(projectId))
      return r
    },
    [projectId]
  )

  const addPlan = useCallback(
    async (body: CreateProfitabilityPlanPayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createProfitabilityPlan(projectId, body)
      setPlans(await profitabilityApi.listProfitabilityPlans(projectId))
      return r
    },
    [projectId]
  )

  const finalizeVersion = useCallback(
    async (planId: string, versionId: string) => {
      if (!projectId) return null
      const r = await profitabilityApi.finalizePlanVersion(projectId, planId, versionId)
      setPlanVersions(await profitabilityApi.listPlanVersions(projectId, planId))
      return r
    },
    [projectId]
  )

  const addAdjustment = useCallback(
    async (body: CreateProfitAdjustmentPayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createAdjustment(projectId, body)
      setAdjustments(await profitabilityApi.listAdjustments(projectId))
      return r
    },
    [projectId]
  )

  const applyAdj = useCallback(
    async (id: string) => {
      if (!projectId) return null
      const r = await profitabilityApi.applyAdjustment(projectId, id)
      setAdjustments(await profitabilityApi.listAdjustments(projectId))
      await loadCore()
      return r
    },
    [projectId, loadCore]
  )

  const addVariance = useCallback(
    async (body: CreateProfitVariancePayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createVariance(projectId, body)
      setVariances(await profitabilityApi.listVariances(projectId))
      return r
    },
    [projectId]
  )

  const addRisk = useCallback(
    async (body: CreateProfitRiskFlagPayload) => {
      if (!projectId) return null
      const r = await profitabilityApi.createRiskFlag(projectId, body)
      setRiskFlags(await profitabilityApi.listRiskFlags(projectId))
      return r
    },
    [projectId]
  )

  const mitigateRisk = useCallback(
    async (id: string) => {
      if (!projectId) return null
      const r = await profitabilityApi.mitigateRiskFlag(projectId, id)
      setRiskFlags(await profitabilityApi.listRiskFlags(projectId))
      return r
    },
    [projectId]
  )

  const closeRisk = useCallback(
    async (id: string) => {
      if (!projectId) return null
      const r = await profitabilityApi.closeRiskFlag(projectId, id)
      setRiskFlags(await profitabilityApi.listRiskFlags(projectId))
      return r
    },
    [projectId]
  )

  const saveThreshold = useCallback(
    async (body: ProfitThresholdPolicy) => {
      if (!projectId) return null
      const r = await profitabilityApi.putThresholdPolicy(projectId, body)
      setThreshold(r)
      return r
    },
    [projectId]
  )

  return {
    tab,
    setTab,
    profile,
    summary,
    costSources,
    revenueSources,
    costForecasts,
    revenueForecasts,
    plans,
    planVersions,
    selectedPlanId,
    setSelectedPlanId,
    adjustments,
    variances,
    riskFlags,
    rateCards,
    threshold,
    loading,
    rebuilding,
    error,
    forbidden,
    refetch: loadCore,
    initProfile,
    rebuild,
    addCostSource,
    archiveCost,
    addRevenueSource,
    archiveRevenue,
    addCostForecast,
    addRevenueForecast,
    addPlan,
    finalizeVersion,
    addAdjustment,
    applyAdj,
    addVariance,
    addRisk,
    mitigateRisk,
    closeRisk,
    saveThreshold,
  }
}
