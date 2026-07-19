import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type {
  CreateResourcePayload,
  IamPageResponse,
  IamResource,
  SearchResourcesParams,
  UpdateResourcePayload,
} from '../model'

export async function searchResources(
  params?: SearchResourcesParams
): Promise<IamPageResponse<IamResource>> {
  return apiClient.get<IamPageResponse<IamResource>>(IAM_ENDPOINTS.resources.search(params))
}

export async function getResource(resourceId: string): Promise<IamResource> {
  return apiClient.get<IamResource>(IAM_ENDPOINTS.resources.get(resourceId))
}

export async function createResource(body: CreateResourcePayload): Promise<IamResource> {
  return apiClient.post<IamResource>(IAM_ENDPOINTS.resources.create(), body)
}

export async function updateResource(
  resourceId: string,
  body: UpdateResourcePayload
): Promise<IamResource> {
  return apiClient.put<IamResource>(IAM_ENDPOINTS.resources.update(resourceId), body)
}

export async function activateResource(resourceId: string): Promise<IamResource> {
  return apiClient.patch<IamResource>(IAM_ENDPOINTS.resources.activate(resourceId))
}

export async function deactivateResource(resourceId: string): Promise<IamResource> {
  return apiClient.patch<IamResource>(IAM_ENDPOINTS.resources.deactivate(resourceId))
}
