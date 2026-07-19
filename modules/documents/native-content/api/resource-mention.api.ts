import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { RESOURCE_REFERENCE_ENDPOINTS } from './intelligence.endpoints'
import type { ResolvedResource, ResourceRef, ResourceTypeDefinition } from '../model/intelligence'

export async function listResourceTypes(
  enabledOnly = true
): Promise<{ items: ResourceTypeDefinition[] }> {
  const res = await apiClient.get<ListPayload<ResourceTypeDefinition>>(RESOURCE_REFERENCE_ENDPOINTS.types(enabledOnly))
  return normalizeItemList(res)
}

export async function batchResolveResources(
  refs: ResourceRef[]
): Promise<{ items: ResolvedResource[] }> {
  const res = await apiClient.post<ListPayload<ResolvedResource>>(RESOURCE_REFERENCE_ENDPOINTS.batchResolve(), { refs })
  return normalizeItemList(res)
}
