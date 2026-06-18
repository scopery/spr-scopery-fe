/**
 * Document collaboration service — v2 API
 */

import { apiClient } from '@/shared/lib/apiClient'
import { COLLABORATION_ENDPOINTS } from '@/constants/endpoints'
import type {
  DocumentActivity,
  DocumentCollaborator,
  DocumentComment,
  DocumentSuggestion,
  MentionableUser,
} from '@/types/collaboration'

function projectQuery(projectId?: string) {
  return projectId ? `?project_id=${encodeURIComponent(projectId)}` : ''
}

export async function listComments(
  orgId: string,
  documentId: string,
  params?: { project_id?: string; include_resolved?: boolean }
): Promise<{ items: DocumentComment[]; page: { total: number } }> {
  return apiClient.get(COLLABORATION_ENDPOINTS.comments(orgId, documentId, params))
}

export async function createComment(
  orgId: string,
  documentId: string,
  body: {
    body: string
    project_id?: string
    parent_id?: string | null
    selected_text?: string | null
    mentioned_user_ids?: string[]
  }
): Promise<DocumentComment> {
  return apiClient.post(COLLABORATION_ENDPOINTS.comments(orgId, documentId), body)
}

export async function resolveComment(
  orgId: string,
  documentId: string,
  commentId: string,
  projectId?: string
): Promise<DocumentComment> {
  return apiClient.post(
    COLLABORATION_ENDPOINTS.resolveComment(orgId, documentId, commentId) + projectQuery(projectId)
  )
}

export async function reopenComment(
  orgId: string,
  documentId: string,
  commentId: string,
  projectId?: string
): Promise<DocumentComment> {
  return apiClient.post(
    COLLABORATION_ENDPOINTS.reopenComment(orgId, documentId, commentId) + projectQuery(projectId)
  )
}

export async function deleteComment(
  orgId: string,
  documentId: string,
  commentId: string,
  projectId?: string
): Promise<{ deleted: boolean }> {
  return apiClient.delete(
    COLLABORATION_ENDPOINTS.comment(orgId, documentId, commentId) + projectQuery(projectId)
  )
}

export async function listSuggestions(
  orgId: string,
  documentId: string,
  params?: { project_id?: string; include_closed?: boolean }
): Promise<{ items: DocumentSuggestion[]; page: { total: number } }> {
  return apiClient.get(COLLABORATION_ENDPOINTS.suggestions(orgId, documentId, params))
}

export async function createSuggestion(
  orgId: string,
  documentId: string,
  body: {
    description: string
    title?: string | null
    project_id?: string
    mentioned_user_ids?: string[]
  }
): Promise<DocumentSuggestion> {
  return apiClient.post(COLLABORATION_ENDPOINTS.suggestions(orgId, documentId), body)
}

export async function acceptSuggestion(
  orgId: string,
  documentId: string,
  suggestionId: string,
  projectId?: string
): Promise<DocumentSuggestion> {
  return apiClient.post(
    COLLABORATION_ENDPOINTS.acceptSuggestion(orgId, documentId, suggestionId) + projectQuery(projectId)
  )
}

export async function rejectSuggestion(
  orgId: string,
  documentId: string,
  suggestionId: string,
  projectId?: string
): Promise<DocumentSuggestion> {
  return apiClient.post(
    COLLABORATION_ENDPOINTS.rejectSuggestion(orgId, documentId, suggestionId) + projectQuery(projectId)
  )
}

export async function listActivity(
  orgId: string,
  documentId: string,
  params?: { project_id?: string; limit?: number }
): Promise<{ items: DocumentActivity[]; page: { total: number } }> {
  return apiClient.get(COLLABORATION_ENDPOINTS.activity(orgId, documentId, params))
}

export async function listCollaborators(
  orgId: string,
  documentId: string,
  projectId?: string
): Promise<{ items: DocumentCollaborator[] }> {
  return apiClient.get(
    COLLABORATION_ENDPOINTS.collaborators(orgId, documentId) + projectQuery(projectId)
  )
}

export async function shareDocument(
  orgId: string,
  documentId: string,
  body: { user_id: string; role: 'viewer' | 'commenter' | 'editor'; project_id?: string }
): Promise<DocumentCollaborator> {
  return apiClient.post(COLLABORATION_ENDPOINTS.share(orgId, documentId), body)
}

export async function removeCollaborator(
  orgId: string,
  documentId: string,
  userId: string,
  projectId?: string
): Promise<{ removed: boolean }> {
  return apiClient.delete(
    COLLABORATION_ENDPOINTS.collaborator(orgId, documentId, userId) + projectQuery(projectId)
  )
}

export async function listMentionableUsers(
  orgId: string,
  params?: { project_id?: string; q?: string }
): Promise<{ items: MentionableUser[] }> {
  return apiClient.get(COLLABORATION_ENDPOINTS.mentionableUsers(orgId, params))
}
