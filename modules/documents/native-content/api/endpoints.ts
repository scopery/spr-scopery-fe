import { apiPath } from '@/shared/lib/api-paths'

/** Wave 4.1 — native document content + revisions (WAVE4_1_API_CONTRACT §1–2). */
export const DOCUMENT_CONTENT_ENDPOINTS = {
  content: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/content`),
  revisions: (projectId: string, documentId: string, params?: { page?: number; size?: number }) => {
    const p = new URLSearchParams()
    if (params?.page != null) p.set('page', String(params.page))
    if (params?.size != null) p.set('size', String(params.size))
    const q = p.toString()
    return (
      apiPath(`/projects/${projectId}/documents/${documentId}/revisions`) + (q ? `?${q}` : '')
    )
  },
  revision: (projectId: string, documentId: string, revisionNo: number) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/revisions/${revisionNo}`),
  restoreRevision: (projectId: string, documentId: string, revisionNo: number) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/revisions/${revisionNo}/restore`),
} as const

/** Wave 4.1 — attachments (WAVE4_1_API_CONTRACT §3). BE path: complete-upload. */
export const DOCUMENT_ATTACHMENT_ENDPOINTS = {
  list: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/attachments`),
  get: (projectId: string, documentId: string, attachmentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/attachments/${attachmentId}`),
  create: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/attachments`),
  completeUpload: (projectId: string, documentId: string, attachmentId: string) =>
    apiPath(
      `/projects/${projectId}/documents/${documentId}/attachments/${attachmentId}/complete-upload`
    ),
} as const

/**
 * Sub-pages path reserved in BE ApiPaths but no controller yet — callers must feature-gate.
 */
export const DOCUMENT_SUBPAGE_ENDPOINTS = {
  list: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/subpages`),
} as const

/** Wave 4.1 — comment threads (§4). */
export const DOCUMENT_COMMENT_ENDPOINTS = {
  list: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/comment-threads`),
  get: (projectId: string, documentId: string, threadId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/comment-threads/${threadId}`),
  create: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/comment-threads`),
  addComment: (projectId: string, documentId: string, threadId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/comment-threads/${threadId}/comments`),
  resolve: (projectId: string, documentId: string, threadId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/comment-threads/${threadId}/resolve`),
  deleteComment: (
    projectId: string,
    documentId: string,
    threadId: string,
    commentId: string
  ) =>
    apiPath(
      `/projects/${projectId}/documents/${documentId}/comment-threads/${threadId}/comments/${commentId}`
    ),
} as const

/** Wave 4.1 — suggestions (§5). */
export const DOCUMENT_SUGGESTION_ENDPOINTS = {
  list: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/suggestions`),
  get: (projectId: string, documentId: string, suggestionId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/suggestions/${suggestionId}`),
  create: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/suggestions`),
  accept: (projectId: string, documentId: string, suggestionId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/suggestions/${suggestionId}/accept`),
  reject: (projectId: string, documentId: string, suggestionId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/suggestions/${suggestionId}/reject`),
} as const
