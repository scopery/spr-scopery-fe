import { apiPath } from '@/shared/lib/api-paths'

/**
 * Scope
 * Description: Scope packages, scope items, and their classification (in/out of scope).
 * Base: /api/projects/{projectId}/scope-packages, /api/projects/{projectId}/scope-items
 */
export const SCOPE_ENDPOINTS = {
  packages: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/scope-packages`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/scope-packages`),
    get: (projectId: string, packageId: string) =>
      apiPath(`/projects/${projectId}/scope-packages/${packageId}`),
    approve: (projectId: string, packageId: string) =>
      apiPath(`/projects/${projectId}/scope-packages/${packageId}/approve`),
    markCurrent: (projectId: string, packageId: string) =>
      apiPath(`/projects/${projectId}/scope-packages/${packageId}/mark-current`),
    archive: (projectId: string, packageId: string) =>
      apiPath(`/projects/${projectId}/scope-packages/${packageId}/archive`),
  },
  items: {
    list: (projectId: string, packageId: string) =>
      apiPath(`/projects/${projectId}/scope-packages/${packageId}/items`),
    create: (projectId: string, packageId: string) =>
      apiPath(`/projects/${projectId}/scope-packages/${packageId}/items`),
    get: (projectId: string, scopeItemId: string) =>
      apiPath(`/projects/${projectId}/scope-items/${scopeItemId}`),
    update: (projectId: string, scopeItemId: string) =>
      apiPath(`/projects/${projectId}/scope-items/${scopeItemId}`),
    archive: (projectId: string, scopeItemId: string) =>
      apiPath(`/projects/${projectId}/scope-items/${scopeItemId}/archive`),
  },
} as const
