import { apiClient } from '@/shared/lib/apiClient'
import { ORGANIZATION_INVITATION_ENDPOINTS } from './endpoints'
import type {
  CreateOrganizationInvitationPayload,
  OrganizationInvitation,
} from '../model/organization-invitation'

export async function createOrganizationInvitation(
  organizationId: string,
  body: CreateOrganizationInvitationPayload
): Promise<OrganizationInvitation> {
  return apiClient.post<OrganizationInvitation>(
    ORGANIZATION_INVITATION_ENDPOINTS.create(organizationId),
    body
  )
}

export async function getOrganizationInvitation(
  organizationId: string,
  invitationId: string
): Promise<OrganizationInvitation> {
  return apiClient.get<OrganizationInvitation>(
    ORGANIZATION_INVITATION_ENDPOINTS.get(organizationId, invitationId)
  )
}

export async function cancelOrganizationInvitation(
  organizationId: string,
  invitationId: string
): Promise<OrganizationInvitation> {
  return apiClient.delete<OrganizationInvitation>(
    ORGANIZATION_INVITATION_ENDPOINTS.cancel(organizationId, invitationId)
  )
}

export async function acceptOrganizationInvitation(token: string): Promise<OrganizationInvitation> {
  return apiClient.post<OrganizationInvitation>(ORGANIZATION_INVITATION_ENDPOINTS.accept(token))
}
