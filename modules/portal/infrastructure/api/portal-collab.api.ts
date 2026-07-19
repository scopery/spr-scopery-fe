import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'

/** Internal (staff) portal collaboration APIs — not the client portalApiClient. */
export const PORTAL_COLLAB_ENDPOINTS = {
  portalAccount: (workspaceId: string, accountId: string) =>
    apiPath(`/workspaces/${workspaceId}/portal-accounts/${accountId}`),
  suspendAccount: (workspaceId: string, accountId: string) =>
    apiPath(`/workspaces/${workspaceId}/portal-accounts/${accountId}/suspend`),
  deactivateAccount: (workspaceId: string, accountId: string) =>
    apiPath(`/workspaces/${workspaceId}/portal-accounts/${accountId}/deactivate`),
  invites: (projectId: string) => apiPath(`/projects/${projectId}/portal-invites`),
  permissionPolicies: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/portal-permission-policies`),
  permissionPolicy: (workspaceId: string, policyId: string) =>
    apiPath(`/workspaces/${workspaceId}/portal-permission-policies/${policyId}`),
  accessGrants: (projectId: string) =>
    apiPath(`/projects/${projectId}/portal-access-grants`),
  revokeGrant: (projectId: string, grantId: string) =>
    apiPath(`/projects/${projectId}/portal-access-grants/${grantId}/revoke`),
  clientReviews: (projectId: string) =>
    apiPath(`/projects/${projectId}/client-reviews`),
  decideClientReview: (projectId: string, reviewId: string) =>
    apiPath(`/projects/${projectId}/client-reviews/${reviewId}/decide`),
  clientFeedback: (projectId: string) =>
    apiPath(`/projects/${projectId}/client-feedback`),
  clientComments: (projectId: string) =>
    apiPath(`/projects/${projectId}/client-comments`),
  portalAuditLogs: (projectId: string) =>
    apiPath(`/projects/${projectId}/portal-audit-logs`),
} as const

export interface PortalInvite {
  id: string
  email: string
  status?: string
  expiresAt?: string | null
}

export interface PortalPermissionPolicy {
  id: string
  code?: string
  name: string
}

export interface PortalAccessGrant {
  id: string
  portalAccountId?: string
  permissionPolicyCode?: string
  status?: string
}

export interface ClientReviewItem {
  id: string
  title?: string
  status?: string
}

export interface ClientFeedbackItem {
  id: string
  body?: string
  status?: string
}

export async function listPortalInvites(
  projectId: string
): Promise<{ items: PortalInvite[] }> {
  const res = await apiClient.get<ListPayload<PortalInvite>>(PORTAL_COLLAB_ENDPOINTS.invites(projectId))
  return normalizeItemList(res)
}

export async function createPortalInvite(
  projectId: string,
  email: string,
  expiresInDays = 7
): Promise<PortalInvite> {
  return apiClient.post(PORTAL_COLLAB_ENDPOINTS.invites(projectId), {
    email,
    expiresInDays,
  })
}

export async function listPortalPermissionPolicies(
  workspaceId: string
): Promise<{ items: PortalPermissionPolicy[] }> {
  const res = await apiClient.get<ListPayload<PortalPermissionPolicy>>(PORTAL_COLLAB_ENDPOINTS.permissionPolicies(workspaceId))
  return normalizeItemList(res)
}

export async function listPortalAccessGrants(
  projectId: string
): Promise<{ items: PortalAccessGrant[] }> {
  const res = await apiClient.get<ListPayload<PortalAccessGrant>>(PORTAL_COLLAB_ENDPOINTS.accessGrants(projectId))
  return normalizeItemList(res)
}

export async function revokePortalAccessGrant(
  projectId: string,
  grantId: string
): Promise<void> {
  await apiClient.post(PORTAL_COLLAB_ENDPOINTS.revokeGrant(projectId, grantId), {}, {
    parseJson: false,
  })
}

export async function suspendPortalAccount(
  workspaceId: string,
  accountId: string
): Promise<void> {
  await apiClient.post(PORTAL_COLLAB_ENDPOINTS.suspendAccount(workspaceId, accountId), {}, {
    parseJson: false,
  })
}

export async function deactivatePortalAccount(
  workspaceId: string,
  accountId: string
): Promise<void> {
  await apiClient.post(PORTAL_COLLAB_ENDPOINTS.deactivateAccount(workspaceId, accountId), {}, {
    parseJson: false,
  })
}

export async function listClientReviews(
  projectId: string
): Promise<{ items: ClientReviewItem[] }> {
  const res = await apiClient.get<ListPayload<ClientReviewItem>>(PORTAL_COLLAB_ENDPOINTS.clientReviews(projectId))
  return normalizeItemList(res)
}

export async function decideClientReview(
  projectId: string,
  reviewId: string,
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
  comment?: string
): Promise<ClientReviewItem> {
  return apiClient.post(PORTAL_COLLAB_ENDPOINTS.decideClientReview(projectId, reviewId), {
    decision,
    comment: comment ?? null,
  })
}

export async function listClientFeedback(
  projectId: string
): Promise<{ items: ClientFeedbackItem[] }> {
  const res = await apiClient.get<ListPayload<ClientFeedbackItem>>(PORTAL_COLLAB_ENDPOINTS.clientFeedback(projectId))
  return normalizeItemList(res)
}

export async function listClientComments(
  projectId: string
): Promise<{ items: ClientFeedbackItem[] }> {
  const res = await apiClient.get<ListPayload<ClientFeedbackItem>>(PORTAL_COLLAB_ENDPOINTS.clientComments(projectId))
  return normalizeItemList(res)
}

export async function listPortalAuditLogs(
  projectId: string
): Promise<{ items: Array<{ id: string; action?: string; createdAt?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; action?: string; createdAt?: string }>>(PORTAL_COLLAB_ENDPOINTS.portalAuditLogs(projectId))
  return normalizeItemList(res)
}
