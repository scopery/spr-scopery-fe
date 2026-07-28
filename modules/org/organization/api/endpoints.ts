import { apiPath } from '@/shared/lib/api-paths'

export const ORGANIZATION_ENDPOINTS = {
  get: (organizationId: string) => apiPath(`/organizations/${organizationId}`),
  activityFeed: (organizationId: string, params?: { page?: number; size?: number }) => {
    const p = new URLSearchParams()
    if (params?.page != null) p.set('page', String(params.page))
    if (params?.size != null) p.set('size', String(params.size))
    const q = p.toString()
    return apiPath(`/organizations/${organizationId}/activity-feed`) + (q ? `?${q}` : '')
  },
} as const
