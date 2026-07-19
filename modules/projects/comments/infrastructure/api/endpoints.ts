import { apiPath } from '@/shared/lib/api-paths'

export const COMMENT_ENDPOINTS = {
  byTarget: (projectId: string, targetType: string, targetId: string) =>
    apiPath(`/projects/${projectId}/comments/by-target?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`),
  threads: (projectId: string) =>
    apiPath(`/projects/${projectId}/comments/threads`),
  thread: (projectId: string, threadId: string) =>
    apiPath(`/projects/${projectId}/comments/threads/${threadId}`),
  resolveThread: (projectId: string, threadId: string) =>
    apiPath(`/projects/${projectId}/comments/threads/${threadId}/resolve`),
  archiveThread: (projectId: string, threadId: string) =>
    apiPath(`/projects/${projectId}/comments/threads/${threadId}/archive`),
  threadComments: (projectId: string, threadId: string) =>
    apiPath(`/projects/${projectId}/comments/threads/${threadId}/comments`),
  comment: (projectId: string, commentId: string) =>
    apiPath(`/projects/${projectId}/comments/${commentId}`),
  deleteComment: (projectId: string, commentId: string) =>
    apiPath(`/projects/${projectId}/comments/${commentId}/delete`),
} as const
