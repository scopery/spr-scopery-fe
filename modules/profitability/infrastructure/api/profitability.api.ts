import { apiClient } from '@/shared/lib/apiClient'
import { PROFITABILITY_ENDPOINTS } from './endpoints'
import type {
  CostForecast,
  CostSource,
  CreateCostForecastPayload,
  CreateCostSourcePayload,
  CreateProfitAdjustmentPayload,
  CreateProfitabilityPlanPayload,
  CreateProfitRateCardPayload,
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
  UpdateProfitRateCardPayload,
} from '../../domain/model/profitability'

function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items ?? [])
}

// --- Workspace billing rate cards ---

export async function listWorkspaceRateCards(
  workspaceId: string
): Promise<ProfitRateCard[]> {
  const data = await apiClient.get<ProfitRateCard[] | { items: ProfitRateCard[] }>(
    PROFITABILITY_ENDPOINTS.workspaceRateCards.list(workspaceId)
  )
  return asList(data)
}

export async function createWorkspaceRateCard(
  workspaceId: string,
  body: CreateProfitRateCardPayload
): Promise<ProfitRateCard> {
  return apiClient.post<ProfitRateCard>(
    PROFITABILITY_ENDPOINTS.workspaceRateCards.create(workspaceId),
    body
  )
}

export async function updateWorkspaceRateCard(
  workspaceId: string,
  id: string,
  body: UpdateProfitRateCardPayload
): Promise<ProfitRateCard> {
  return apiClient.put<ProfitRateCard>(
    PROFITABILITY_ENDPOINTS.workspaceRateCards.update(workspaceId, id),
    body
  )
}

export async function archiveWorkspaceRateCard(
  workspaceId: string,
  id: string
): Promise<ProfitRateCard> {
  return apiClient.post<ProfitRateCard>(
    PROFITABILITY_ENDPOINTS.workspaceRateCards.archive(workspaceId, id),
    {}
  )
}

// --- Project billing rate cards ---

export async function listProjectRateCards(projectId: string): Promise<ProfitRateCard[]> {
  const data = await apiClient.get<ProfitRateCard[] | { items: ProfitRateCard[] }>(
    PROFITABILITY_ENDPOINTS.projectRateCards.list(projectId)
  )
  return asList(data)
}

export async function createProjectRateCard(
  projectId: string,
  body: CreateProfitRateCardPayload
): Promise<ProfitRateCard> {
  return apiClient.post<ProfitRateCard>(
    PROFITABILITY_ENDPOINTS.projectRateCards.create(projectId),
    body
  )
}

export async function archiveProjectRateCard(
  projectId: string,
  id: string
): Promise<ProfitRateCard> {
  return apiClient.post<ProfitRateCard>(
    PROFITABILITY_ENDPOINTS.projectRateCards.archive(projectId, id),
    {}
  )
}

// --- Profile & summary ---

export async function getProfitabilityProfile(
  projectId: string
): Promise<ProfitabilityProfile | null> {
  try {
    return await apiClient.get<ProfitabilityProfile>(
      PROFITABILITY_ENDPOINTS.profile.get(projectId),
      { skipErrorToast: true }
    )
  } catch {
    return null
  }
}

export async function createProfitabilityProfile(
  projectId: string,
  body: { currency: string }
): Promise<ProfitabilityProfile> {
  return apiClient.post<ProfitabilityProfile>(
    PROFITABILITY_ENDPOINTS.profile.create(projectId),
    body
  )
}

export async function getProfitabilitySummary(
  projectId: string
): Promise<ProfitabilitySummary | null> {
  try {
    return await apiClient.get<ProfitabilitySummary>(
      PROFITABILITY_ENDPOINTS.summary.get(projectId),
      { skipErrorToast: true }
    )
  } catch {
    return null
  }
}

export async function rebuildProfitabilitySummary(
  projectId: string
): Promise<ProfitabilitySummary> {
  return apiClient.post<ProfitabilitySummary>(
    PROFITABILITY_ENDPOINTS.summary.rebuild(projectId),
    {}
  )
}

// --- Sources ---

export async function listCostSources(projectId: string): Promise<CostSource[]> {
  const data = await apiClient.get<CostSource[] | { items: CostSource[] }>(
    PROFITABILITY_ENDPOINTS.costSources.list(projectId)
  )
  return asList(data)
}

export async function createCostSource(
  projectId: string,
  body: CreateCostSourcePayload
): Promise<CostSource> {
  return apiClient.post<CostSource>(
    PROFITABILITY_ENDPOINTS.costSources.create(projectId),
    body
  )
}

export async function archiveCostSource(
  projectId: string,
  sourceId: string
): Promise<CostSource> {
  return apiClient.post<CostSource>(
    PROFITABILITY_ENDPOINTS.costSources.archive(projectId, sourceId),
    {}
  )
}

export async function listRevenueSources(projectId: string): Promise<RevenueSource[]> {
  const data = await apiClient.get<RevenueSource[] | { items: RevenueSource[] }>(
    PROFITABILITY_ENDPOINTS.revenueSources.list(projectId)
  )
  return asList(data)
}

export async function createRevenueSource(
  projectId: string,
  body: CreateRevenueSourcePayload
): Promise<RevenueSource> {
  return apiClient.post<RevenueSource>(
    PROFITABILITY_ENDPOINTS.revenueSources.create(projectId),
    body
  )
}

export async function archiveRevenueSource(
  projectId: string,
  sourceId: string
): Promise<RevenueSource> {
  return apiClient.post<RevenueSource>(
    PROFITABILITY_ENDPOINTS.revenueSources.archive(projectId, sourceId),
    {}
  )
}

// --- Forecasts ---

export async function listCostForecasts(projectId: string): Promise<CostForecast[]> {
  const data = await apiClient.get<CostForecast[] | { items: CostForecast[] }>(
    PROFITABILITY_ENDPOINTS.costForecasts.list(projectId)
  )
  return asList(data)
}

export async function createCostForecast(
  projectId: string,
  body: CreateCostForecastPayload
): Promise<CostForecast> {
  return apiClient.post<CostForecast>(
    PROFITABILITY_ENDPOINTS.costForecasts.create(projectId),
    body
  )
}

export async function archiveCostForecast(
  projectId: string,
  forecastId: string
): Promise<CostForecast> {
  return apiClient.post<CostForecast>(
    PROFITABILITY_ENDPOINTS.costForecasts.archive(projectId, forecastId),
    {}
  )
}

export async function listRevenueForecasts(projectId: string): Promise<RevenueForecast[]> {
  const data = await apiClient.get<RevenueForecast[] | { items: RevenueForecast[] }>(
    PROFITABILITY_ENDPOINTS.revenueForecasts.list(projectId)
  )
  return asList(data)
}

export async function createRevenueForecast(
  projectId: string,
  body: CreateRevenueForecastPayload
): Promise<RevenueForecast> {
  return apiClient.post<RevenueForecast>(
    PROFITABILITY_ENDPOINTS.revenueForecasts.create(projectId),
    body
  )
}

export async function archiveRevenueForecast(
  projectId: string,
  forecastId: string
): Promise<RevenueForecast> {
  return apiClient.post<RevenueForecast>(
    PROFITABILITY_ENDPOINTS.revenueForecasts.archive(projectId, forecastId),
    {}
  )
}

// --- Plans ---

export async function listProfitabilityPlans(
  projectId: string
): Promise<ProfitabilityPlan[]> {
  const data = await apiClient.get<ProfitabilityPlan[] | { items: ProfitabilityPlan[] }>(
    PROFITABILITY_ENDPOINTS.plans.list(projectId)
  )
  return asList(data)
}

export async function createProfitabilityPlan(
  projectId: string,
  body: CreateProfitabilityPlanPayload
): Promise<ProfitabilityPlan> {
  return apiClient.post<ProfitabilityPlan>(
    PROFITABILITY_ENDPOINTS.plans.create(projectId),
    body
  )
}

export async function listPlanVersions(
  projectId: string,
  planId: string
): Promise<ProfitabilityPlanVersion[]> {
  const data = await apiClient.get<
    ProfitabilityPlanVersion[] | { items: ProfitabilityPlanVersion[] }
  >(PROFITABILITY_ENDPOINTS.plans.versions(projectId, planId))
  return asList(data)
}

export async function finalizePlanVersion(
  projectId: string,
  planId: string,
  versionId: string
): Promise<ProfitabilityPlanVersion> {
  return apiClient.post<ProfitabilityPlanVersion>(
    PROFITABILITY_ENDPOINTS.plans.finalizeVersion(projectId, planId, versionId),
    {}
  )
}

// --- Adjustments ---

export async function listAdjustments(projectId: string): Promise<ProfitAdjustment[]> {
  const data = await apiClient.get<ProfitAdjustment[] | { items: ProfitAdjustment[] }>(
    PROFITABILITY_ENDPOINTS.adjustments.list(projectId)
  )
  return asList(data)
}

export async function createAdjustment(
  projectId: string,
  body: CreateProfitAdjustmentPayload
): Promise<ProfitAdjustment> {
  return apiClient.post<ProfitAdjustment>(
    PROFITABILITY_ENDPOINTS.adjustments.create(projectId),
    body
  )
}

export async function applyAdjustment(
  projectId: string,
  adjustmentId: string
): Promise<ProfitAdjustment> {
  return apiClient.post<ProfitAdjustment>(
    PROFITABILITY_ENDPOINTS.adjustments.apply(projectId, adjustmentId),
    {}
  )
}

// --- Threshold ---

export async function getThresholdPolicy(
  projectId: string
): Promise<ProfitThresholdPolicy | null> {
  try {
    return await apiClient.get<ProfitThresholdPolicy>(
      PROFITABILITY_ENDPOINTS.thresholdPolicy.get(projectId)
    )
  } catch {
    return null
  }
}

export async function putThresholdPolicy(
  projectId: string,
  body: ProfitThresholdPolicy
): Promise<ProfitThresholdPolicy> {
  return apiClient.put<ProfitThresholdPolicy>(
    PROFITABILITY_ENDPOINTS.thresholdPolicy.put(projectId),
    body
  )
}

// --- Variance ---

export async function listVariances(projectId: string): Promise<ProfitVariance[]> {
  const data = await apiClient.get<ProfitVariance[] | { items: ProfitVariance[] }>(
    PROFITABILITY_ENDPOINTS.variance.list(projectId)
  )
  return asList(data)
}

export async function createVariance(
  projectId: string,
  body: CreateProfitVariancePayload
): Promise<ProfitVariance> {
  return apiClient.post<ProfitVariance>(
    PROFITABILITY_ENDPOINTS.variance.create(projectId),
    body
  )
}

// --- Risk flags ---

export async function listRiskFlags(projectId: string): Promise<ProfitRiskFlag[]> {
  const data = await apiClient.get<ProfitRiskFlag[] | { items: ProfitRiskFlag[] }>(
    PROFITABILITY_ENDPOINTS.riskFlags.list(projectId)
  )
  return asList(data)
}

export async function createRiskFlag(
  projectId: string,
  body: CreateProfitRiskFlagPayload
): Promise<ProfitRiskFlag> {
  return apiClient.post<ProfitRiskFlag>(
    PROFITABILITY_ENDPOINTS.riskFlags.create(projectId),
    body
  )
}

export async function mitigateRiskFlag(
  projectId: string,
  id: string
): Promise<ProfitRiskFlag> {
  return apiClient.post<ProfitRiskFlag>(
    PROFITABILITY_ENDPOINTS.riskFlags.mitigate(projectId, id),
    {}
  )
}

export async function closeRiskFlag(projectId: string, id: string): Promise<ProfitRiskFlag> {
  return apiClient.post<ProfitRiskFlag>(
    PROFITABILITY_ENDPOINTS.riskFlags.close(projectId, id),
    {}
  )
}
