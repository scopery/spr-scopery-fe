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

export const KNOWLEDGE_ENDPOINTS = {
  list: (params?: { q?: string }) =>
    withQuery(apiPath('/knowledge/document-types'), params),
  get: (id: string) => apiPath(`/knowledge/document-types/${id}`),
  createWorkspace: () => apiPath('/knowledge/document-types/workspace'),
  indexingJobs: (workspaceId: string) =>
    apiPath(`/knowledge/workspaces/${workspaceId}/indexing-jobs`),
  reindexWorkspace: (workspaceId: string) =>
    apiPath(`/knowledge/indexing/workspaces/${workspaceId}/reindex`),
  reindexProject: (projectId: string) =>
    apiPath(`/knowledge/indexing/projects/${projectId}/reindex`),
  indexingJob: (jobId: string) => apiPath(`/knowledge/indexing/jobs/${jobId}`),
  graphRelated: (entityId: string) =>
    apiPath(`/knowledge/entities/${entityId}/related`),
  documentClassifications: () => apiPath('/knowledge/document-classifications'),
  source: (sourceId: string) => apiPath(`/knowledge/sources/${sourceId}`),
  sourceChunks: (sourceId: string, params?: { page?: number; size?: number }) =>
    withQuery(apiPath(`/knowledge/sources/${sourceId}/chunks`), params),
  reindexSource: (sourceId: string) =>
    apiPath(`/knowledge/sources/${sourceId}/reindex`),
  documentStatus: (projectId: string, documentId: string) =>
    apiPath(`/knowledge/indexing/projects/${projectId}/documents/${documentId}/status`),
  reindexDocument: (projectId: string, documentId: string) =>
    apiPath(`/knowledge/indexing/projects/${projectId}/documents/${documentId}/reindex`),
} as const
