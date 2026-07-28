import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const ORGANIZATION_MEMBER_ENDPOINTS = {
  list: (
    organizationId: string,
    params?: { userId?: string; status?: string; page?: number; size?: number }
  ) =>
    withQuery(
      apiPath(`/organizations/${organizationId}/members`),
      params as Record<string, string | number | boolean | undefined>
    ),
  get: (organizationId: string, memberId: string) =>
    apiPath(`/organizations/${organizationId}/members/${memberId}`),
  add: (organizationId: string) => apiPath(`/organizations/${organizationId}/members`),
  remove: (organizationId: string, memberId: string) =>
    apiPath(`/organizations/${organizationId}/members/${memberId}`),
  activate: (organizationId: string, memberId: string) =>
    apiPath(`/organizations/${organizationId}/members/${memberId}/activate`),
  suspend: (organizationId: string, memberId: string) =>
    apiPath(`/organizations/${organizationId}/members/${memberId}/suspend`),
  accessByUser: (organizationId: string, userId: string) =>
    apiPath(`/organizations/${organizationId}/members/by-user/${userId}/access`),
} as const
