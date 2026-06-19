import { ORG_ENDPOINTS } from '../../org/api/endpoints'
import { ORG_INVITE_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { OrgInvite, OrgInviteCreateResponse, OrgInvitesResponse } from '../model/org-invite'

export type { OrgInvite, OrgInviteCreateResponse, OrgInvitesResponse } from '../model/org-invite'

export async function listInvites(
  orgId: string,
  params?: { limit?: number; offset?: number }
): Promise<OrgInvitesResponse> {
  const url = ORG_ENDPOINTS.invites(orgId, params)
  return apiClient.get<OrgInvitesResponse>(url)
}

export async function createInvite(
  orgId: string,
  body: { email: string; role: 'member' | 'partner' }
): Promise<OrgInviteCreateResponse> {
  const url = ORG_ENDPOINTS.createInvite(orgId)
  return apiClient.post<OrgInviteCreateResponse>(url, body)
}

export async function revokeInvite(orgId: string, inviteId: string): Promise<OrgInvite> {
  const url = ORG_ENDPOINTS.revokeInvite(orgId, inviteId)
  return apiClient.post<OrgInvite>(url)
}

export async function acceptInvite(token: string): Promise<{
  org_id: string
  member: { user_id: string; role: string; status: string }
}> {
  const url = ORG_INVITE_ENDPOINTS.accept()
  return apiClient.post<{
    org_id: string
    member: { user_id: string; role: string; status: string }
  }>(url, { token })
}
