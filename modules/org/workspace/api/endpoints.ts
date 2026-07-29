import { apiPath } from '@/shared/lib/api-paths'

export const WORKSPACE_ENDPOINTS = {
  create: () => apiPath('/workspaces'),
  get: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}`),
  update: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}`),
  members: (workspaceId: string, params?: { status?: string; page?: number; size?: number }) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.page != null) p.set('page', String(params.page))
    if (params?.size != null) p.set('size', String(params.size))
    const q = p.toString()
    return apiPath(`/workspaces/${workspaceId}/members`) + (q ? `?${q}` : '')
  },
  deactivateMember: (workspaceId: string, memberId: string) =>
    apiPath(`/workspaces/${workspaceId}/members/${memberId}/deactivate`),
  accessByUser: (workspaceId: string, userId: string) =>
    apiPath(`/workspaces/${workspaceId}/members/by-user/${userId}/access`),
  projectAccessByUser: (workspaceId: string, userId: string) =>
    apiPath(`/workspaces/${workspaceId}/members/by-user/${userId}/project-access`),
  activityFeed: (workspaceId: string, params?: { page?: number; size?: number }) => {
    const p = new URLSearchParams()
    if (params?.page != null) p.set('page', String(params.page))
    if (params?.size != null) p.set('size', String(params.size))
    const q = p.toString()
    return apiPath(`/workspaces/${workspaceId}/activity-feed`) + (q ? `?${q}` : '')
  },
  dailySummary: (workspaceId: string, date?: string) => {
    const base = apiPath(`/workspaces/${workspaceId}/tasks/daily-summary`)
    return date ? `${base}?date=${date}` : base
  },
} as const
