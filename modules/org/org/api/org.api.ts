import { ORG_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { OrgListResponse, OrgDetail, OrgMembersResponse, OrgMember } from '../model/org'

export type {
  OrgListItem,
  OrgListResponse,
  OrgDetail,
  OrgMember,
  OrgMembersResponse,
} from '../model/org'

export async function listOrgs(params?: {
  limit?: number
  offset?: number
}): Promise<OrgListResponse> {
  const url = ORG_ENDPOINTS.list(params)
  return apiClient.get<OrgListResponse>(url)
}

export async function getOrg(orgId: string): Promise<OrgDetail> {
  const url = ORG_ENDPOINTS.get(orgId)
  return apiClient.get<OrgDetail>(url)
}

export async function createOrg(name: string): Promise<{
  id: string
  name: string
  status: string
  created_at: string
}> {
  const url = ORG_ENDPOINTS.create()
  return apiClient.post<{ id: string; name: string; status: string; created_at: string }>(url, {
    name,
  })
}

export async function setDefaultOrg(orgId: string): Promise<{ default_org_id: string }> {
  const url = ORG_ENDPOINTS.setDefault(orgId)
  return apiClient.put<{ default_org_id: string }>(url)
}

export async function getOrgMembers(
  orgId: string,
  params?: { limit?: number; offset?: number }
): Promise<OrgMembersResponse> {
  const url = ORG_ENDPOINTS.members(orgId, params)
  return apiClient.get<OrgMembersResponse>(url)
}

export async function patchOrgMember(
  orgId: string,
  userId: string,
  body: { role?: 'owner' | 'member' | 'partner'; status?: 'removed' }
): Promise<OrgMember> {
  const url = ORG_ENDPOINTS.member(orgId, userId)
  return apiClient.patch<OrgMember>(url, body)
}

export async function leaveOrg(orgId: string): Promise<OrgMember> {
  const url = ORG_ENDPOINTS.leave(orgId)
  return apiClient.post<OrgMember>(url)
}
