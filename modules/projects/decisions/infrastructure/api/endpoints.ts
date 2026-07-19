import { apiPath } from '@/shared/lib/api-paths'

/**
 * Decision Records
 * Base: /api/projects/{projectId}/decisions
 */
export const DECISION_ENDPOINTS = {
  list: (projectId: string) => apiPath(`/projects/${projectId}/decisions`),
  create: (projectId: string) => apiPath(`/projects/${projectId}/decisions`),
  get: (projectId: string, decisionId: string) =>
    apiPath(`/projects/${projectId}/decisions/${decisionId}`),
  update: (projectId: string, decisionId: string) =>
    apiPath(`/projects/${projectId}/decisions/${decisionId}`),
  supersede: (projectId: string, decisionId: string) =>
    apiPath(`/projects/${projectId}/decisions/${decisionId}/supersede`),
  decide: (projectId: string, decisionId: string) =>
    apiPath(`/projects/${projectId}/decisions/${decisionId}/decide`),
  reject: (projectId: string, decisionId: string) =>
    apiPath(`/projects/${projectId}/decisions/${decisionId}/reject`),
  archive: (projectId: string, decisionId: string) =>
    apiPath(`/projects/${projectId}/decisions/${decisionId}/archive`),
  options: {
    list: (projectId: string, decisionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/options`),
    create: (projectId: string, decisionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/options`),
    update: (projectId: string, decisionId: string, optionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/options/${optionId}`),
    delete: (projectId: string, decisionId: string, optionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/options/${optionId}`),
  },
  impact: {
    get: (projectId: string, decisionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/impact`),
    update: (projectId: string, decisionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/impact`),
  },
  links: {
    list: (projectId: string, decisionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/links`),
    create: (projectId: string, decisionId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/links`),
    delete: (projectId: string, decisionId: string, linkId: string) =>
      apiPath(`/projects/${projectId}/decisions/${decisionId}/links/${linkId}`),
  },
} as const
