import { v2 } from '@/shared/lib/api-paths'

export const SESSION_ENDPOINTS = {
  list: (orgId: string, projectId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects/${projectId}/sessions`) + (q ? `?${q}` : '')
  },
  create: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}/sessions`),
  get: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}`),
  putAnswers: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/answers`),
  submit: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/submit`),
  lock: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/lock`),
  reopen: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/reopen`),
  progress: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/progress`),
  fromRevision: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/from-revision`),
} as const
