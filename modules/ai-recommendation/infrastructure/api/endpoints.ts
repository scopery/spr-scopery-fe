import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const AI_RECOMMENDATION_ENDPOINTS = {
  list: (params?: { projectId?: string; workspaceId?: string }) =>
    params?.projectId
      ? withQuery(
          apiPath(`/ai-recommendations/projects/${params.projectId}/suggestions`),
          { workspaceId: params.workspaceId }
        )
      : withQuery(apiPath('/ai-recommendations'), params),
  get: (suggestionRef: string, workspaceId?: string) =>
    withQuery(
      apiPath(`/ai-recommendations/suggestions/${encodeURIComponent(suggestionRef)}`),
      { workspaceId }
    ),
  view: (suggestionRef: string) =>
    apiPath(
      `/ai-recommendations/suggestions/${encodeURIComponent(suggestionRef)}/view`),
  accept: (suggestionRef: string) =>
    apiPath(
      `/ai-recommendations/suggestions/${encodeURIComponent(suggestionRef)}/accept`),
  reject: (suggestionRef: string) =>
    apiPath(
      `/ai-recommendations/suggestions/${encodeURIComponent(suggestionRef)}/reject`),
  prepareApply: (suggestionRef: string) =>
    apiPath(
      `/ai-recommendations/suggestions/${encodeURIComponent(suggestionRef)}/prepare-apply`),
  nextBestActions: (projectId: string, workspaceId?: string) =>
    withQuery(
      apiPath(`/ai-recommendations/projects/${projectId}/next-best-actions`),
      { workspaceId }
    ),
} as const
