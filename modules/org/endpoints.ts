import { apiPath } from '@/shared/lib/api-paths'

/**
 * Org
 * Description: Organisation management: CRUD for orgs, member management,
 *              and invitation lifecycle (create, revoke).
 */
export const ORG_ENDPOINTS = {
  /* --- Org CRUD --- */
  list: (params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath('/organizations') + (q ? `?${q}` : '')
  },
  create: () => apiPath('/organizations'),
  get: (orgId: string) => apiPath(`/organizations/${orgId}`),
  setDefault: (orgId: string) => apiPath(`/organizations/${orgId}/default`),

  /* --- Members --- */
  members: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath(`/organizations/${orgId}/members`) + (q ? `?${q}` : '')
  },
  member: (orgId: string, userId: string) => apiPath(`/organizations/${orgId}/members/${userId}`),
  leave: (orgId: string) => apiPath(`/organizations/${orgId}/leave`),

  /* --- Invites --- */
  invites: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath(`/organizations/${orgId}/invitations`) + (q ? `?${q}` : '')
  },
  createInvite: (orgId: string) => apiPath(`/organizations/${orgId}/invitations`),
  revokeInvite: (orgId: string, inviteId: string) =>
    apiPath(`/organizations/${orgId}/invitations/${inviteId}`),
} as const

/**
 * Org Invites (public)
 * Description: Public-facing invite acceptance endpoint — no auth context required.
 */
export const ORG_INVITE_ENDPOINTS = {
  accept: (token: string) => apiPath(`/org-invitations/${token}/accept`),
} as const
