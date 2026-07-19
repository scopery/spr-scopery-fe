import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { DOCUMENT_COMMENT_ENDPOINTS } from './endpoints'
import type { DocumentCommentThread } from '../model/collaboration'

export async function listCommentThreads(
  projectId: string,
  documentId: string
): Promise<{ items: DocumentCommentThread[] }> {
  const res = await apiClient.get<ListPayload<DocumentCommentThread>>(DOCUMENT_COMMENT_ENDPOINTS.list(projectId, documentId))
  return normalizeItemList(res)
}

export async function getCommentThread(
  projectId: string,
  documentId: string,
  threadId: string
): Promise<DocumentCommentThread> {
  return apiClient.get(DOCUMENT_COMMENT_ENDPOINTS.get(projectId, documentId, threadId))
}

export async function createCommentThread(
  projectId: string,
  documentId: string,
  body: { blockId?: string; anchorText?: string; firstCommentBody: string }
): Promise<DocumentCommentThread> {
  return apiClient.post(DOCUMENT_COMMENT_ENDPOINTS.create(projectId, documentId), body)
}

export async function addCommentToThread(
  projectId: string,
  documentId: string,
  threadId: string,
  body: { body: string }
): Promise<DocumentCommentThread> {
  return apiClient.post(DOCUMENT_COMMENT_ENDPOINTS.addComment(projectId, documentId, threadId), body)
}

export async function resolveCommentThread(
  projectId: string,
  documentId: string,
  threadId: string
): Promise<DocumentCommentThread> {
  return apiClient.post(DOCUMENT_COMMENT_ENDPOINTS.resolve(projectId, documentId, threadId), {})
}

export async function deleteComment(
  projectId: string,
  documentId: string,
  threadId: string,
  commentId: string
): Promise<void> {
  await apiClient.delete(
    DOCUMENT_COMMENT_ENDPOINTS.deleteComment(projectId, documentId, threadId, commentId),
    { parseJson: false }
  )
}
