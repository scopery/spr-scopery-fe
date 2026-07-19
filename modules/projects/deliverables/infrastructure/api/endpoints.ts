import { apiPath } from '@/shared/lib/api-paths'

/**
 * Deliverables
 * Description: Project deliverables and their acceptance criteria.
 * Base: /api/projects/{projectId}/deliverables
 */
export const DELIVERABLE_ENDPOINTS = {
  list: (projectId: string) => apiPath(`/projects/${projectId}/deliverables`),
  create: (projectId: string) => apiPath(`/projects/${projectId}/deliverables`),
  get: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}`),
  update: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}`),
  changeStatus: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}/status`),
  archive: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}/archive`),
  accept: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}/accept`),
  reopen: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}/reopen`),

  acceptanceCriteria: {
    list: (projectId: string, deliverableId: string) =>
      apiPath(`/projects/${projectId}/deliverables/${deliverableId}/acceptance-criteria`),
    create: (projectId: string, deliverableId: string) =>
      apiPath(`/projects/${projectId}/deliverables/${deliverableId}/acceptance-criteria`),
    satisfy: (projectId: string, criteriaId: string) =>
      apiPath(`/projects/${projectId}/acceptance-criteria/${criteriaId}/satisfy`),
    waive: (projectId: string, criteriaId: string) =>
      apiPath(`/projects/${projectId}/acceptance-criteria/${criteriaId}/waive`),
  },
} as const
