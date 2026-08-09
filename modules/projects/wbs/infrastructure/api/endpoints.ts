import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const WBS_ENDPOINTS = {
  tree: (projectId: string, phaseId?: string) =>
    withQuery(apiPath(`/projects/${projectId}/wbs-nodes/tree`), {
      phaseId,
    }),
  list: (projectId: string) => apiPath(`/projects/${projectId}/wbs-nodes`),
  create: (projectId: string) => apiPath(`/projects/${projectId}/wbs-nodes`),
  /** Wave-1 stub — no bulk UI yet; BE path is /wbs-nodes/bulk. */
  bulk: (projectId: string) => apiPath(`/projects/${projectId}/wbs-nodes/bulk`),
  update: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/wbs-nodes/${id}`),
  move: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/wbs-nodes/${id}/move`),
  archive: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/wbs-nodes/${id}/archive`),
  delete: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/wbs-nodes/${id}`),
} as const
