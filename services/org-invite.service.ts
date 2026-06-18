/**
 * Org invite service — v2 API (Phase 2)
 */

import { ORG_ENDPOINTS, ORG_INVITE_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'

export interface OrgInvite {
  id: string
  org_id: string
  email: string
  role: 'member' | 'partner'
  status: string
  expires_at: string
  created_at: string
}

export interface OrgInviteCreateResponse extends OrgInvite {
  invite_link?: string
  invite_token?: string
}

export interface OrgInvitesResponse {
  items: OrgInvite[]
  page: { limit: number; offset: number; total: number }
}

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

export async function acceptInvite(token: string): Promise<{ org_id: string; member: { user_id: string; role: string; status: string } }> {
  const url = ORG_INVITE_ENDPOINTS.accept()
  return apiClient.post<{ org_id: string; member: { user_id: string; role: string; status: string } }>(url, { token })
}
