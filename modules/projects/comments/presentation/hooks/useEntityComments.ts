'use client'

import { useCallback, useEffect, useState } from 'react'
import * as commentsApi from '../../infrastructure/api/comments.api'
import type { Comment } from '../../domain/model/comment'
import type { CommentThread, CreateThreadPayload } from '../../domain/model/comment-thread'

export function useEntityComments(
  projectId: string | null,
  targetType: string | null,
  targetId: string | null
) {
  const [threads, setThreads] = useState<CommentThread[]>([])
  const [commentsByThread, setCommentsByThread] = useState<Record<string, Comment[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadThreads = useCallback(async () => {
    if (!projectId || !targetType || !targetId) {
      setThreads([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await commentsApi.listThreadsByTarget(projectId, targetType, targetId)
      setThreads(res ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
      setThreads([])
    } finally {
      setLoading(false)
    }
  }, [projectId, targetType, targetId])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  const loadComments = useCallback(
    async (threadId: string) => {
      if (!projectId) return
      const comments = await commentsApi.listComments(projectId, threadId)
      setCommentsByThread((prev) => ({ ...prev, [threadId]: comments ?? [] }))
    },
    [projectId]
  )

  const postThread = useCallback(
    async (body: CreateThreadPayload) => {
      if (!projectId) return null
      const created = await commentsApi.createThread(projectId, body)
      await loadThreads()
      return created
    },
    [projectId, loadThreads]
  )

  const postComment = useCallback(
    async (threadId: string, body: string, mentionedUserIds?: string[]) => {
      if (!projectId) return null
      const created = await commentsApi.createComment(projectId, threadId, {
        body,
        mentionedUserIds,
      })
      await loadComments(threadId)
      return created
    },
    [projectId, loadComments]
  )

  const resolveThread = useCallback(
    async (threadId: string) => {
      if (!projectId) return null
      const updated = await commentsApi.resolveThread(projectId, threadId)
      setThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)))
      return updated
    },
    [projectId]
  )

  const removeComment = useCallback(
    async (threadId: string, commentId: string) => {
      if (!projectId) return
      await commentsApi.deleteComment(projectId, commentId)
      await loadComments(threadId)
    },
    [projectId, loadComments]
  )

  return {
    threads,
    commentsByThread,
    loading,
    error,
    refetch: loadThreads,
    loadComments,
    postThread,
    postComment,
    resolveThread,
    removeComment,
  }
}
