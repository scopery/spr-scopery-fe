import { apiClient } from '@/shared/lib/apiClient'
import { EXTERNAL_PARTY_ENDPOINTS } from './endpoints'
import type {
  CreateExternalOrganizationPayload,
  ExternalOrganization,
} from '../../domain/model/external-organization'

export async function listExternalOrganizations(
  workspaceId: string
): Promise<ExternalOrganization[]> {
  return apiClient.get<ExternalOrganization[]>(
    EXTERNAL_PARTY_ENDPOINTS.organizations.list(workspaceId)
  )
}

export async function getExternalOrganization(
  workspaceId: string,
  organizationId: string
): Promise<ExternalOrganization> {
  return apiClient.get<ExternalOrganization>(
    EXTERNAL_PARTY_ENDPOINTS.organizations.get(workspaceId, organizationId)
  )
}

export async function createExternalOrganization(
  workspaceId: string,
  body: CreateExternalOrganizationPayload
): Promise<ExternalOrganization> {
  return apiClient.post<ExternalOrganization>(
    EXTERNAL_PARTY_ENDPOINTS.organizations.create(workspaceId),
    body
  )
}
