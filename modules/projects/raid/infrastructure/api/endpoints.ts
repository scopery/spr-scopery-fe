import { apiPath } from '@/shared/lib/api-paths'

/**
 * RAID (Risks, Assumptions, Issues, Dependencies)
 * Base: /api/projects/{projectId}/raid-items
 */
export const RAID_ENDPOINTS = {
  list: (projectId: string, params?: { type?: string }) => {
    const p = new URLSearchParams()
    if (params?.type) p.set('type', params.type)
    const q = p.toString()
    return apiPath(`/projects/${projectId}/raid-items`) + (q ? `?${q}` : '')
  },
  create: (projectId: string) => apiPath(`/projects/${projectId}/raid-items`),
  get: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}`),
  update: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}`),
  changeStatus: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/status`),
  resolve: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/resolve`),
  close: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/close`),
  reopen: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/reopen`),
  escalate: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/escalate`),
  archive: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/archive`),
  convertToIssue: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/convert-risk-to-issue`),
  createCRDraft: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/create-change-request-draft`),
} as const
