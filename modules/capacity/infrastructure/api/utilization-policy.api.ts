import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type {
  UpdateUtilizationThresholdPolicyPayload,
  UtilizationThresholdPolicy,
} from '../../domain/model/utilization-threshold-policy'

export async function getWorkspaceUtilizationPolicy(
  workspaceId: string
): Promise<UtilizationThresholdPolicy> {
  return apiClient.get<UtilizationThresholdPolicy>(
    CAPACITY_ENDPOINTS.utilizationPolicy.getWorkspace(workspaceId)
  )
}

export async function updateWorkspaceUtilizationPolicy(
  workspaceId: string,
  body: UpdateUtilizationThresholdPolicyPayload
): Promise<UtilizationThresholdPolicy> {
  return apiClient.put<UtilizationThresholdPolicy>(
    CAPACITY_ENDPOINTS.utilizationPolicy.updateWorkspace(workspaceId),
    body
  )
}
