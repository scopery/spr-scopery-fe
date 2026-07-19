import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CreateProjectAllocationPayload,
  ProjectAllocationSearchParams,
  ProjectResourceAllocation,
  UpdateProjectAllocationPayload,
} from '../../domain/model/project-allocation'

export async function listProjectAllocations(
  params: ProjectAllocationSearchParams
): Promise<PageResponse<ProjectResourceAllocation>> {
  return apiClient.get<PageResponse<ProjectResourceAllocation>>(
    CAPACITY_ENDPOINTS.allocations.list(params)
  )
}

export async function createProjectAllocation(
  workspaceId: string,
  body: CreateProjectAllocationPayload
): Promise<ProjectResourceAllocation> {
  return apiClient.post<ProjectResourceAllocation>(
    CAPACITY_ENDPOINTS.allocations.create(workspaceId),
    body
  )
}

export async function updateProjectAllocation(
  allocationId: string,
  body: UpdateProjectAllocationPayload
): Promise<ProjectResourceAllocation> {
  return apiClient.put<ProjectResourceAllocation>(
    CAPACITY_ENDPOINTS.allocations.update(allocationId),
    body
  )
}

export async function activateProjectAllocation(
  allocationId: string
): Promise<ProjectResourceAllocation> {
  return apiClient.patch<ProjectResourceAllocation>(
    CAPACITY_ENDPOINTS.allocations.activate(allocationId)
  )
}

export async function deactivateProjectAllocation(
  allocationId: string
): Promise<ProjectResourceAllocation> {
  return apiClient.patch<ProjectResourceAllocation>(
    CAPACITY_ENDPOINTS.allocations.deactivate(allocationId)
  )
}

export async function archiveProjectAllocation(
  allocationId: string
): Promise<ProjectResourceAllocation> {
  return apiClient.patch<ProjectResourceAllocation>(
    CAPACITY_ENDPOINTS.allocations.archive(allocationId)
  )
}
