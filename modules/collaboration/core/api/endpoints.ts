import { v2 } from '@/shared/lib/api-paths'

export const COLLABORATION_ENDPOINTS = {
  comments: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; include_resolved?: boolean }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.include_resolved != null) p.set('include_resolved', String(params.include_resolved))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments`) + (q ? `?${q}` : '')
  },
  comment: (orgId: string, documentId: string, commentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments/${commentId}`),
  resolveComment: (orgId: string, documentId: string, commentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments/${commentId}/resolve`),
  reopenComment: (orgId: string, documentId: string, commentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments/${commentId}/reopen`),
  suggestions: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; include_closed?: boolean }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.include_closed != null) p.set('include_closed', String(params.include_closed))
    const q = p.toString()
    return (
      v2(`/orgs/${orgId}/documents/${documentId}/collaboration/suggestions`) + (q ? `?${q}` : '')
    )
  },
  acceptSuggestion: (orgId: string, documentId: string, suggestionId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/suggestions/${suggestionId}/accept`),
  rejectSuggestion: (orgId: string, documentId: string, suggestionId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/suggestions/${suggestionId}/reject`),
  activity: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.limit != null) p.set('limit', String(params.limit))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/collaboration/activity`) + (q ? `?${q}` : '')
  },
  collaborators: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/collaborators`),
  collaborator: (orgId: string, documentId: string, userId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/collaborators/${userId}`),
  share: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/share`),
  mentionableUsers: (orgId: string, params?: { project_id?: string; q?: string }) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.q) p.set('q', params.q)
    const q = p.toString()
    return v2(`/orgs/${orgId}/mentionable-users`) + (q ? `?${q}` : '')
  },
} as const
