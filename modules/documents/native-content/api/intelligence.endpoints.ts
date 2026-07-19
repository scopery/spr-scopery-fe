import { apiPath } from '@/shared/lib/api-paths'

/** Wave 4.1 §8 — client visibility. */
export const CLIENT_VISIBILITY_ENDPOINTS = {
  enable: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/client-visibility/enable`),
  disable: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/client-visibility/disable`),
  validate: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/validate-client-visibility`),
} as const

/**
 * Wave 4.1 §9–10 — resource mentions.
 * BE uses GET /types?enabledOnly=true (not /types/enabled).
 * Mentions search path exists in ApiPaths but has no controller yet.
 */
export const RESOURCE_REFERENCE_ENDPOINTS = {
  types: (enabledOnly?: boolean) =>
    apiPath(
      `/resource-references/types${enabledOnly ? '?enabledOnly=true' : ''}`
    ),
  type: (id: string) => apiPath(`/resource-references/types/${id}`),
  batchResolve: () => apiPath(`/resource-references/batch-resolve`),
} as const

/** Wave 4.1 §11 — AI context. */
export const AI_CONTEXT_ENDPOINTS = {
  resolve: () => apiPath(`/ai-context/resolve`),
  policies: () => apiPath(`/ai-context/policies`),
  audit: (documentId: string, page = 0, size = 20) =>
    apiPath(
      `/ai-context/audit?documentId=${encodeURIComponent(documentId)}&page=${page}&size=${size}`
    ),
} as const
