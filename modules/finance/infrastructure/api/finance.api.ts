import { apiClient } from '@/shared/lib/apiClient'
import { FINANCE_ENDPOINTS } from './endpoints'
import type {
  CreateCustomCostPayload,
  CreateFinanceScenarioPayload,
  CreateVendorCostPayload,
  CustomCost,
  FinanceCompareResult,
  FinanceScenario,
  FinanceSummary,
  PhaseFinance,
  UpdateCustomCostPayload,
  UpdateFinanceScenarioPayload,
  UpdatePhaseRevenuePayload,
  UpdateVendorCostPayload,
  VendorCost,
} from '../../domain/model/finance'

function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function listFinanceScenarios(projectId: string): Promise<FinanceScenario[]> {
  const data = await apiClient.get<FinanceScenario[] | { items: FinanceScenario[] }>(
    FINANCE_ENDPOINTS.scenarios.list(projectId)
  )
  return asList(data)
}

export async function createFinanceScenario(
  projectId: string,
  body: CreateFinanceScenarioPayload
): Promise<FinanceScenario> {
  return apiClient.post<FinanceScenario>(FINANCE_ENDPOINTS.scenarios.create(projectId), body)
}

export async function getFinanceScenario(
  projectId: string,
  scenarioId: string
): Promise<FinanceScenario> {
  return apiClient.get<FinanceScenario>(FINANCE_ENDPOINTS.scenarios.get(projectId, scenarioId))
}

export async function updateFinanceScenario(
  projectId: string,
  scenarioId: string,
  body: UpdateFinanceScenarioPayload
): Promise<FinanceScenario> {
  return apiClient.put<FinanceScenario>(
    FINANCE_ENDPOINTS.scenarios.update(projectId, scenarioId),
    body
  )
}

export async function compareFinanceScenarios(
  projectId: string,
  leftScenarioId: string,
  rightScenarioId: string
): Promise<FinanceCompareResult> {
  return apiClient.get<FinanceCompareResult>(
    FINANCE_ENDPOINTS.scenarios.compare(projectId, leftScenarioId, rightScenarioId)
  )
}

export async function recalculateFinanceScenario(
  projectId: string,
  scenarioId: string
): Promise<FinanceScenario> {
  return apiClient.post<FinanceScenario>(
    FINANCE_ENDPOINTS.scenarios.recalculate(projectId, scenarioId),
    {}
  )
}

export async function approveFinanceScenario(
  projectId: string,
  scenarioId: string
): Promise<FinanceScenario> {
  return apiClient.post<FinanceScenario>(
    FINANCE_ENDPOINTS.scenarios.approve(projectId, scenarioId),
    {}
  )
}

export async function markFinanceCurrent(
  projectId: string,
  scenarioId: string
): Promise<FinanceScenario> {
  return apiClient.post<FinanceScenario>(
    FINANCE_ENDPOINTS.scenarios.markCurrent(projectId, scenarioId),
    {}
  )
}

export async function archiveFinanceScenario(
  projectId: string,
  scenarioId: string
): Promise<FinanceScenario> {
  return apiClient.patch<FinanceScenario>(
    FINANCE_ENDPOINTS.scenarios.archive(projectId, scenarioId),
    {}
  )
}

export async function duplicateFinanceScenario(
  projectId: string,
  scenarioId: string
): Promise<FinanceScenario> {
  return apiClient.post<FinanceScenario>(
    FINANCE_ENDPOINTS.scenarios.duplicate(projectId, scenarioId),
    {}
  )
}

export async function getFinanceSummary(
  projectId: string,
  scenarioId: string
): Promise<FinanceSummary | null> {
  try {
    return await apiClient.get<FinanceSummary>(
      FINANCE_ENDPOINTS.scenarios.summary(projectId, scenarioId),
      { skipErrorToast: true }
    )
  } catch {
    return null
  }
}

export async function listPhaseFinances(
  projectId: string,
  scenarioId: string
): Promise<PhaseFinance[]> {
  const data = await apiClient.get<PhaseFinance[] | { items: PhaseFinance[] }>(
    FINANCE_ENDPOINTS.scenarios.phases.list(projectId, scenarioId)
  )
  return asList(data)
}

export async function updatePhaseRevenue(
  projectId: string,
  scenarioId: string,
  phaseFinanceId: string,
  body: UpdatePhaseRevenuePayload
): Promise<PhaseFinance> {
  return apiClient.put<PhaseFinance>(
    FINANCE_ENDPOINTS.scenarios.phases.updateRevenue(projectId, scenarioId, phaseFinanceId),
    body
  )
}

export async function listCustomCosts(
  projectId: string,
  scenarioId: string
): Promise<CustomCost[]> {
  const data = await apiClient.get<CustomCost[] | { items: CustomCost[] }>(
    FINANCE_ENDPOINTS.scenarios.customCosts.list(projectId, scenarioId)
  )
  return asList(data)
}

export async function createCustomCost(
  projectId: string,
  scenarioId: string,
  body: CreateCustomCostPayload
): Promise<CustomCost> {
  return apiClient.post<CustomCost>(
    FINANCE_ENDPOINTS.scenarios.customCosts.create(projectId, scenarioId),
    body
  )
}

export async function updateCustomCost(
  projectId: string,
  scenarioId: string,
  costId: string,
  body: UpdateCustomCostPayload
): Promise<CustomCost> {
  return apiClient.put<CustomCost>(
    FINANCE_ENDPOINTS.scenarios.customCosts.update(projectId, scenarioId, costId),
    body
  )
}

export async function archiveCustomCost(
  projectId: string,
  scenarioId: string,
  costId: string
): Promise<CustomCost> {
  return apiClient.patch<CustomCost>(
    FINANCE_ENDPOINTS.scenarios.customCosts.archive(projectId, scenarioId, costId),
    {}
  )
}

export async function listVendorCosts(
  projectId: string,
  scenarioId: string
): Promise<VendorCost[]> {
  const data = await apiClient.get<VendorCost[] | { items: VendorCost[] }>(
    FINANCE_ENDPOINTS.scenarios.vendorCosts.list(projectId, scenarioId)
  )
  return asList(data)
}

export async function createVendorCost(
  projectId: string,
  scenarioId: string,
  body: CreateVendorCostPayload
): Promise<VendorCost> {
  return apiClient.post<VendorCost>(
    FINANCE_ENDPOINTS.scenarios.vendorCosts.create(projectId, scenarioId),
    body
  )
}

export async function updateVendorCost(
  projectId: string,
  scenarioId: string,
  costId: string,
  body: UpdateVendorCostPayload
): Promise<VendorCost> {
  return apiClient.put<VendorCost>(
    FINANCE_ENDPOINTS.scenarios.vendorCosts.update(projectId, scenarioId, costId),
    body
  )
}

export async function archiveVendorCost(
  projectId: string,
  scenarioId: string,
  costId: string
): Promise<VendorCost> {
  return apiClient.patch<VendorCost>(
    FINANCE_ENDPOINTS.scenarios.vendorCosts.archive(projectId, scenarioId, costId),
    {}
  )
}

export async function getCurrentFinance(projectId: string): Promise<FinanceScenario | null> {
  try {
    return await apiClient.get<FinanceScenario>(FINANCE_ENDPOINTS.current.get(projectId), {
      skipErrorToast: true,
    })
  } catch {
    return null
  }
}

export async function getCurrentFinanceSummary(
  projectId: string
): Promise<FinanceSummary | null> {
  try {
    return await apiClient.get<FinanceSummary>(FINANCE_ENDPOINTS.current.summary(projectId), {
      skipErrorToast: true,
    })
  } catch {
    return null
  }
}

export async function listCurrentFinancePhases(
  projectId: string
): Promise<PhaseFinance[]> {
  try {
    const data = await apiClient.get<PhaseFinance[] | { items: PhaseFinance[] }>(
      FINANCE_ENDPOINTS.current.phases(projectId),
      { skipErrorToast: true }
    )
    return asList(data)
  } catch {
    return []
  }
}
