import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import { mapSyncFromMembersResult } from '../mappers/capacity-overview.mapper'
import type {
  CreateResourceProfilePayload,
  ResourceProfile,
  SyncFromMembersResult,
} from '../../domain/model/resource-profile'

export async function listResourceProfiles(workspaceId: string): Promise<ResourceProfile[]> {
  const data = await apiClient.get<ResourceProfile[] | { items: ResourceProfile[] }>(
    CAPACITY_ENDPOINTS.resources.list(workspaceId),
    { skipErrorToast: true }
  )
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function getResourceProfile(
  workspaceId: string,
  resourceId: string
): Promise<ResourceProfile> {
  return apiClient.get<ResourceProfile>(CAPACITY_ENDPOINTS.resources.get(workspaceId, resourceId), {
    skipErrorToast: true,
  })
}

export async function createResourceProfile(
  workspaceId: string,
  body: CreateResourceProfilePayload
): Promise<ResourceProfile> {
  return apiClient.post<ResourceProfile>(CAPACITY_ENDPOINTS.resources.create(workspaceId), body)
}

export async function archiveResourceProfile(
  workspaceId: string,
  resourceId: string
): Promise<ResourceProfile> {
  return apiClient.patch<ResourceProfile>(
    CAPACITY_ENDPOINTS.resources.archive(workspaceId, resourceId)
  )
}

export async function syncResourcesFromMembers(
  workspaceId: string
): Promise<SyncFromMembersResult> {
  const raw = await apiClient.post<unknown>(
    CAPACITY_ENDPOINTS.resources.syncFromMembers(workspaceId),
    {}
  )
  return mapSyncFromMembersResult(raw)
}

export async function rebuildResourceUtilization(
  workspaceId: string,
  resourceId: string,
  body?: { effortHours?: number; availableCapacityHours?: number }
): Promise<unknown> {
  return apiClient.post(
    CAPACITY_ENDPOINTS.resources.rebuildUtilization(workspaceId, resourceId),
    body ?? {}
  )
}
