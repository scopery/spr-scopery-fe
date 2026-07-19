import { apiPath } from '@/shared/lib/api-paths'

/**
 * Sessions
 * Description: Session lifecycle within a project: create, retrieve, submit, lock/reopen,
 *              save answers, track progress, and create from a prior revision.
 */
export const SESSION_ENDPOINTS = {
  /* --- CRUD --- */
  list: (orgId: string, projectId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath(`/projects/${projectId}/sessions`) + (q ? `?${q}` : '')
  },
  create: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/sessions`),
  get: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}`),

  /* --- Lifecycle --- */
  submit: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/submit`),
  lock: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/lock`),
  reopen: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/reopen`),
  fromRevision: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/sessions/from-revision`),

  /* --- Data --- */
  putAnswers: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/answers`),
  progress: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/progress`),
} as const
