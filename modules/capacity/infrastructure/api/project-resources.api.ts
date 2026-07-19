import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type {
  AssignmentConflict,
  CreateResourceRiskFlagPayload,
  ProjectAllocationSummary,
  ResourceRiskFlag,
} from '../../domain/model/project-resource-plan'
import type {
  UpdateUtilizationThresholdPolicyPayload,
  UtilizationThresholdPolicy,
} from '../../domain/model/utilization-threshold-policy'

function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function getProjectAllocationSummary(
  projectId: string,
  params?: { fromDate?: string; toDate?: string }
): Promise<ProjectAllocationSummary> {
  return apiClient.get<ProjectAllocationSummary>(
    CAPACITY_ENDPOINTS.calculation.projectAllocationSummary(projectId, params)
  )
}

export async function rebuildEffortForecast(projectId: string): Promise<unknown> {
  return apiClient.post(CAPACITY_ENDPOINTS.projectResources.rebuildEffortForecast(projectId), {})
}

export async function rebuildCapacitySummary(projectId: string): Promise<unknown> {
  return apiClient.post(
    CAPACITY_ENDPOINTS.projectResources.rebuildCapacitySummary(projectId),
    {}
  )
}

export async function getCostInputs(
  projectId: string,
  includeSensitive = false
): Promise<unknown> {
  return apiClient.get(
    CAPACITY_ENDPOINTS.projectResources.costInputs(projectId, includeSensitive)
  )
}

export async function rebuildCostInputs(
  projectId: string,
  includeSensitive = false
): Promise<unknown> {
  return apiClient.post(
    CAPACITY_ENDPOINTS.projectResources.rebuildCostInputs(projectId, includeSensitive),
    {}
  )
}

export async function listRiskFlags(projectId: string): Promise<ResourceRiskFlag[]> {
  const data = await apiClient.get<ResourceRiskFlag[] | { items: ResourceRiskFlag[] }>(
    CAPACITY_ENDPOINTS.projectResources.riskFlags(projectId)
  )
  return asList(data)
}

export async function createRiskFlag(
  projectId: string,
  body: CreateResourceRiskFlagPayload
): Promise<ResourceRiskFlag> {
  return apiClient.post<ResourceRiskFlag>(
    CAPACITY_ENDPOINTS.projectResources.riskFlags(projectId),
    body
  )
}

export async function mitigateRiskFlag(
  projectId: string,
  riskFlagId: string
): Promise<ResourceRiskFlag> {
  return apiClient.post<ResourceRiskFlag>(
    CAPACITY_ENDPOINTS.projectResources.mitigateRisk(projectId, riskFlagId),
    {}
  )
}

export async function closeRiskFlag(
  projectId: string,
  riskFlagId: string
): Promise<ResourceRiskFlag> {
  return apiClient.post<ResourceRiskFlag>(
    CAPACITY_ENDPOINTS.projectResources.closeRisk(projectId, riskFlagId),
    {}
  )
}

export async function listAssignmentConflicts(
  projectId: string
): Promise<AssignmentConflict[]> {
  const data = await apiClient.get<AssignmentConflict[] | { items: AssignmentConflict[] }>(
    CAPACITY_ENDPOINTS.projectResources.conflicts(projectId)
  )
  return asList(data)
}

export async function acknowledgeConflict(
  projectId: string,
  conflictId: string
): Promise<AssignmentConflict> {
  return apiClient.post<AssignmentConflict>(
    CAPACITY_ENDPOINTS.projectResources.acknowledgeConflict(projectId, conflictId),
    {}
  )
}

export async function recalculateConflicts(projectId: string): Promise<unknown> {
  return apiClient.post(
    CAPACITY_ENDPOINTS.projectResources.recalculateConflicts(projectId),
    {}
  )
}

export async function getProjectUtilizationPolicy(
  projectId: string
): Promise<UtilizationThresholdPolicy> {
  return apiClient.get<UtilizationThresholdPolicy>(
    CAPACITY_ENDPOINTS.projectResources.utilizationPolicy(projectId)
  )
}

export async function updateProjectUtilizationPolicy(
  projectId: string,
  body: UpdateUtilizationThresholdPolicyPayload
): Promise<UtilizationThresholdPolicy> {
  return apiClient.put<UtilizationThresholdPolicy>(
    CAPACITY_ENDPOINTS.projectResources.utilizationPolicy(projectId),
    body
  )
}
