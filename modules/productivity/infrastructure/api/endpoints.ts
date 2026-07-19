import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const PRODUCTIVITY_ENDPOINTS = {
  search: (params: { q: string; workspaceId?: string; limit?: number }) =>
    withQuery(apiPath('/search'), params),
  workInbox: (workspaceId: string, params?: { limit?: number; offset?: number }) =>
    withQuery(apiPath(`/workspaces/${workspaceId}/work-inbox`), params),
  markInboxRead: (workspaceId: string, itemId: string) =>
    apiPath(`/workspaces/${workspaceId}/work-inbox/${itemId}/read`),
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
