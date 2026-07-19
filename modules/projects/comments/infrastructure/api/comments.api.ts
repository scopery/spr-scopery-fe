import { apiClient } from '@/shared/lib/apiClient'
import { COMMENT_ENDPOINTS } from './endpoints'
import type { Comment, CreateCommentPayload, UpdateCommentPayload } from '../../domain/model/comment'
import type { CommentThread, CreateThreadPayload } from '../../domain/model/comment-thread'

export async function listThreadsByTarget(
  projectId: string,
  targetType: string,
  targetId: string
): Promise<CommentThread[]> {
  return apiClient.get<CommentThread[]>(
    COMMENT_ENDPOINTS.byTarget(projectId, targetType, targetId)
  )
}

export async function createThread(
  projectId: string,
  body: CreateThreadPayload
): Promise<CommentThread> {
  return apiClient.post<CommentThread>(COMMENT_ENDPOINTS.threads(projectId), body)
}

export async function getThread(projectId: string, threadId: string): Promise<CommentThread> {
  return apiClient.get<CommentThread>(COMMENT_ENDPOINTS.thread(projectId, threadId))
}

export async function resolveThread(projectId: string, threadId: string): Promise<CommentThread> {
  return apiClient.post<CommentThread>(COMMENT_ENDPOINTS.resolveThread(projectId, threadId))
}

export async function archiveThread(projectId: string, threadId: string): Promise<CommentThread> {
  return apiClient.post<CommentThread>(COMMENT_ENDPOINTS.archiveThread(projectId, threadId))
}

export async function listComments(projectId: string, threadId: string): Promise<Comment[]> {
  return apiClient.get<Comment[]>(COMMENT_ENDPOINTS.threadComments(projectId, threadId))
}

export async function createComment(
  projectId: string,
  threadId: string,
  body: CreateCommentPayload
): Promise<Comment> {
  return apiClient.post<Comment>(COMMENT_ENDPOINTS.threadComments(projectId, threadId), body)
}

export async function updateComment(
  projectId: string,
  commentId: string,
  body: UpdateCommentPayload
): Promise<Comment> {
  return apiClient.patch<Comment>(COMMENT_ENDPOINTS.comment(projectId, commentId), body)
}

export async function deleteComment(projectId: string, commentId: string): Promise<void> {
  await apiClient.post<void>(COMMENT_ENDPOINTS.deleteComment(projectId, commentId))
}
