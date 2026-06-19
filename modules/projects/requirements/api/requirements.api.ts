import { PROJECT_ENDPOINTS } from '../../project/api/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { Requirement, RequirementsListResponse } from '../model/requirements'

export type { Requirement, RequirementType, RequirementsListResponse } from '../model/requirements'

export async function listRequirements(
  orgId: string,
  projectId: string,
  params?: { limit?: number; offset?: number }
): Promise<RequirementsListResponse> {
  const url = PROJECT_ENDPOINTS.requirements(orgId, projectId)
  const res = await apiClient.get<RequirementsListResponse | Requirement[]>(url)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}
