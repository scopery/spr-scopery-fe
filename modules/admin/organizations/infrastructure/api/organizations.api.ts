import { apiClient } from '@/shared/lib/apiClient'
import { ORGANIZATION_ENDPOINTS } from './endpoints'
import type {
  Organization,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  SearchOrganizationsParams,
} from '../../domain/model/organization'

export interface OrganizationPageResponse {
  items: Organization[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export async function createOrganization(body: CreateOrganizationPayload): Promise<Organization> {
  return apiClient.post<Organization>(ORGANIZATION_ENDPOINTS.create(), body)
}

export async function getOrganization(orgId: string): Promise<Organization> {
  return apiClient.get<Organization>(ORGANIZATION_ENDPOINTS.get(orgId))
}

export async function searchOrganizations(
  params?: SearchOrganizationsParams
): Promise<OrganizationPageResponse> {
  return apiClient.get<OrganizationPageResponse>(ORGANIZATION_ENDPOINTS.search(params))
}

export async function updateOrganization(
  orgId: string,
  body: UpdateOrganizationPayload
): Promise<Organization> {
  return apiClient.put<Organization>(ORGANIZATION_ENDPOINTS.update(orgId), body)
}

export async function activateOrganization(orgId: string): Promise<Organization> {
  return apiClient.patch<Organization>(ORGANIZATION_ENDPOINTS.activate(orgId))
}

export async function archiveOrganization(orgId: string): Promise<Organization> {
  return apiClient.patch<Organization>(ORGANIZATION_ENDPOINTS.archive(orgId))
}
