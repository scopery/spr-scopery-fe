import { v2 } from '@/shared/lib/api-paths'

export const PROJECT_ENDPOINTS = {
  list: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects`) + (q ? `?${q}` : '')
  },
  create: (orgId: string) => v2(`/orgs/${orgId}/projects`),
  get: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}`),
  questions: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/questions`),
  question: (orgId: string, projectId: string, questionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/questions/${questionId}`),
  questionsReorder: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/questions/reorder`),
  members: (orgId: string, projectId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects/${projectId}/members`) + (q ? `?${q}` : '')
  },
  projectMember: (orgId: string, projectId: string, userId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/members/${userId}`),
  scope: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}/scope`),
  trace: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}/trace`),
  requirements: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements`),
  requirement: (orgId: string, projectId: string, requirementId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}`),
  requirementActors: (orgId: string, projectId: string, requirementId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}/actors`),
  requirementModules: (orgId: string, projectId: string, requirementId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}/modules`),
  traceLinks: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/trace-links`),
  traceLink: (orgId: string, projectId: string, linkId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/trace-links/${linkId}`),
} as const
