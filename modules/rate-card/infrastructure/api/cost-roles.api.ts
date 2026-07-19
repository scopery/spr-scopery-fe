import { apiClient } from '@/shared/lib/apiClient'
import { RATE_CARD_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CostRole,
  CostRoleSearchParams,
  CreateCostRolePayload,
  UpdateCostRolePayload,
} from '../../domain/model/cost-role'

export async function listCostRoles(
  params?: CostRoleSearchParams
): Promise<PageResponse<CostRole>> {
  return apiClient.get<PageResponse<CostRole>>(RATE_CARD_ENDPOINTS.costRoles.list(params))
}

export async function getCostRole(roleId: string): Promise<CostRole> {
  return apiClient.get<CostRole>(RATE_CARD_ENDPOINTS.costRoles.get(roleId))
}

export async function createCostRole(body: CreateCostRolePayload): Promise<CostRole> {
  return apiClient.post<CostRole>(RATE_CARD_ENDPOINTS.costRoles.create(), body)
}

export async function updateCostRole(
  roleId: string,
  body: UpdateCostRolePayload
): Promise<CostRole> {
  return apiClient.put<CostRole>(RATE_CARD_ENDPOINTS.costRoles.update(roleId), body)
}

export async function activateCostRole(roleId: string): Promise<CostRole> {
  return apiClient.patch<CostRole>(RATE_CARD_ENDPOINTS.costRoles.activate(roleId))
}

export async function deactivateCostRole(roleId: string): Promise<CostRole> {
  return apiClient.patch<CostRole>(RATE_CARD_ENDPOINTS.costRoles.deactivate(roleId))
}

export async function archiveCostRole(roleId: string): Promise<CostRole> {
  return apiClient.patch<CostRole>(RATE_CARD_ENDPOINTS.costRoles.archive(roleId))
}
