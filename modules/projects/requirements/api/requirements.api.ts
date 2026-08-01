import { PROJECT_ENDPOINTS } from '../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { assertBulkItemCount, type BulkJobResponse } from '@/shared/lib/bulkJobs'
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

/** Async bulk — returns job immediately; caller polls via useBulkJobPoller. */
export async function submitRequirementsBulk(
  orgId: string,
  projectId: string,
  items: CreateRequirementPayload[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(PROJECT_ENDPOINTS.requirementsBulk(orgId, projectId), { items }, { skipGlobalLoading: true })
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
