import { v2 } from '@/shared/lib/api-paths'

export const ORG_ENDPOINTS = {
  list: (params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2('/orgs') + (q ? `?${q}` : '')
  },
  create: () => v2('/orgs'),
  get: (orgId: string) => v2(`/orgs/${orgId}`),
  setDefault: (orgId: string) => v2(`/orgs/${orgId}/default`),
  members: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/members`) + (q ? `?${q}` : '')
  },
  member: (orgId: string, userId: string) => v2(`/orgs/${orgId}/members/${userId}`),
  leave: (orgId: string) => v2(`/orgs/${orgId}/leave`),
  invites: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/invites`) + (q ? `?${q}` : '')
  },
  createInvite: (orgId: string) => v2(`/orgs/${orgId}/invites`),
  revokeInvite: (orgId: string, inviteId: string) =>
    v2(`/orgs/${orgId}/invites/${inviteId}/revoke`),
} as const
