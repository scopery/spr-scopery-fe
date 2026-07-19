import { apiClient } from '@/shared/lib/apiClient'
import { ORGANIZATION_MEMBER_ENDPOINTS } from './endpoints'
import type {
  AddOrganizationMemberPayload,
  OrganizationMember,
  PageResponse,
} from '../model/organization-member'

export async function listOrganizationMembers(
  organizationId: string,
  params?: { userId?: string; status?: string; page?: number; size?: number }
): Promise<PageResponse<OrganizationMember>> {
  return apiClient.get<PageResponse<OrganizationMember>>(
    ORGANIZATION_MEMBER_ENDPOINTS.list(organizationId, params)
  )
}

export async function addOrganizationMember(
  organizationId: string,
  body: AddOrganizationMemberPayload
): Promise<OrganizationMember> {
  return apiClient.post<OrganizationMember>(ORGANIZATION_MEMBER_ENDPOINTS.add(organizationId), body)
}

export async function removeOrganizationMember(
  organizationId: string,
  memberId: string
): Promise<OrganizationMember> {
  return apiClient.delete<OrganizationMember>(
    ORGANIZATION_MEMBER_ENDPOINTS.remove(organizationId, memberId)
  )
}

export async function activateOrganizationMember(
  organizationId: string,
  memberId: string
): Promise<OrganizationMember> {
  return apiClient.patch<OrganizationMember>(
    ORGANIZATION_MEMBER_ENDPOINTS.activate(organizationId, memberId)
  )
}

export async function suspendOrganizationMember(
  organizationId: string,
  memberId: string
): Promise<OrganizationMember> {
  return apiClient.patch<OrganizationMember>(
    ORGANIZATION_MEMBER_ENDPOINTS.suspend(organizationId, memberId)
  )
}
