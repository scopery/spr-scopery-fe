import { apiPath } from '@/shared/lib/api-paths'
import type { MyInsightsParams } from '../../domain/model/my-insights'
import type { MyWorkParams } from '../../domain/model/my-work'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

function myWorkQuery(params?: MyWorkParams): string {
  if (!params) return ''
  const p = new URLSearchParams()
  if (params.window) p.set('window', String(params.window))
  if (params.dateFrom) p.set('dateFrom', params.dateFrom)
  if (params.dateTo) p.set('dateTo', params.dateTo)
  if (params.projectId) p.set('projectId', params.projectId)
  if (params.includeCompleted != null) p.set('includeCompleted', String(params.includeCompleted))
  if (params.page != null) p.set('page', String(params.page))
  if (params.size != null) p.set('size', String(params.size))
  if (params.status != null) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status]
    for (const s of statuses) {
      if (s) p.append('status', s)
    }
  }
  const q = p.toString()
  return q ? `?${q}` : ''
}

export const PRODUCTIVITY_ENDPOINTS = {
  search: (params: { q: string; workspaceId?: string; limit?: number }) =>
    withQuery(apiPath('/search'), params),
  workInbox: (workspaceId: string, params?: { limit?: number; offset?: number }) =>
    withQuery(apiPath(`/workspaces/${workspaceId}/work-inbox`), params),
  markInboxRead: (workspaceId: string, itemId: string) =>
    apiPath(`/workspaces/${workspaceId}/work-inbox/${itemId}/mark-read`),
  myOrgInvitations: () => apiPath('/me/org-invitations'),
  acceptMyOrgInvitation: (id: string) => apiPath(`/me/org-invitations/${id}/accept`),
  acceptMyWorkspaceInvitation: (id: string) =>
    apiPath(`/me/workspace-invitations/${id}/accept`),
  myWork: (workspaceId: string, params?: MyWorkParams) =>
    apiPath(`/workspaces/${workspaceId}/my-work`) + myWorkQuery(params),
  myInsights: (workspaceId: string, params?: MyInsightsParams) =>
    withQuery(apiPath(`/workspaces/${workspaceId}/my-insights`), {
      range: params?.range,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      projectId: params?.projectId,
      phaseId: params?.phaseId,
      status: params?.status,
      heatmapMetric: params?.heatmapMetric,
    }),
  favorites: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/favorites`),
  recent: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/recent-items`),
  savedViews: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/saved-views`),
  savedSearches: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/saved-searches`),
  pins: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/pins`),
  navigation: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/navigation`),
  navigationPreferences: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/navigation/preferences`),
} as const
