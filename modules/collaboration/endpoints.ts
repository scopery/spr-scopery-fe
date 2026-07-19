import { apiPath } from '@/shared/lib/api-paths'

/**
 * Collaboration
 * Description: Document-level collaboration: threaded comments, inline suggestions,
 *              activity feed, collaborator access, sharing, and mentionable users.
 */
export const COLLABORATION_ENDPOINTS = {
  /* --- Comments --- */
  comments: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; include_resolved?: boolean }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.include_resolved != null) p.set('include_resolved', String(params.include_resolved))
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/comments`) + (q ? `?${q}` : '')
  },
  comment: (orgId: string, documentId: string, commentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/comments/${commentId}`),
  resolveComment: (orgId: string, documentId: string, commentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/comments/${commentId}/resolve`),
  reopenComment: (orgId: string, documentId: string, commentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/comments/${commentId}/reopen`),

  /* --- Suggestions --- */
  suggestions: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; include_closed?: boolean }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.include_closed != null) p.set('include_closed', String(params.include_closed))
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/suggestions`) + (q ? `?${q}` : '')
  },
  acceptSuggestion: (orgId: string, documentId: string, suggestionId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/suggestions/${suggestionId}/accept`),
  rejectSuggestion: (orgId: string, documentId: string, suggestionId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/suggestions/${suggestionId}/reject`),

  /* --- Activity & sharing --- */
  activity: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.limit != null) p.set('limit', String(params.limit))
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/activity`) + (q ? `?${q}` : '')
  },
  collaborators: (orgId: string, documentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/collaborators`),
  collaborator: (orgId: string, documentId: string, userId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/collaborators/${userId}`),
  share: (orgId: string, documentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/collaboration/share`),

  /* --- Users --- */
  mentionableUsers: (orgId: string, params?: { project_id?: string; q?: string }) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.q) p.set('q', params.q)
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/members`) + (q ? `?${q}` : '')
  },
} as const
