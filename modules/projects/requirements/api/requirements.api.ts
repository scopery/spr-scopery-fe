import { PROJECT_ENDPOINTS } from '../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  CreateRequirementPayload,
  Requirement,
  RequirementsListResponse,
  UpdateRequirementPayload,
} from '../model/requirements'

export type { Requirement, RequirementType, RequirementsListResponse } from '../model/requirements'

export async function listRequirements(
  orgId: string,
  projectId: string,
  _params?: { limit?: number; offset?: number }
): Promise<RequirementsListResponse> {
  const url = PROJECT_ENDPOINTS.requirements(orgId, projectId)
  const res = await apiClient.get<RequirementsListResponse | Requirement[]>(url)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}

export async function createRequirement(
  orgId: string,
  projectId: string,
  body: CreateRequirementPayload
): Promise<Requirement> {
  return apiClient.post<Requirement>(PROJECT_ENDPOINTS.requirements(orgId, projectId), body)
}

export async function updateRequirement(
  orgId: string,
  projectId: string,
  requirementId: string,
  body: UpdateRequirementPayload
): Promise<Requirement> {
  return apiClient.patch<Requirement>(
    PROJECT_ENDPOINTS.requirement(orgId, projectId, requirementId),
    body
  )
}
