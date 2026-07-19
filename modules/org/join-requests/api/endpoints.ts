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

export const JOIN_REQUEST_ENDPOINTS = {
  submitDirect: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/join-requests`),
  submitByCode: () => apiPath('/workspace-join-requests'),
  list: (workspaceId: string, params?: { status?: string }) =>
    withQuery(
      apiPath(`/workspaces/${workspaceId}/join-requests`),
      params as Record<string, string | number | boolean | undefined>
    ),
  approve: (workspaceId: string, requestId: string) =>
    apiPath(`/workspaces/${workspaceId}/join-requests/${requestId}/approve`),
  reject: (workspaceId: string, requestId: string) =>
    apiPath(`/workspaces/${workspaceId}/join-requests/${requestId}/reject`),
  cancel: (workspaceId: string, requestId: string) =>
    apiPath(`/workspaces/${workspaceId}/join-requests/${requestId}`),
} as const
