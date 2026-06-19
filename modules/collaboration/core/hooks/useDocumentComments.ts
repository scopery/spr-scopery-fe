'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as collaborationApi from '../api/collaboration.api'
import type { DocumentComment } from '../model/collaboration'

interface UseDocumentCommentsOptions {
  orgId: string
  documentId: string
  projectId?: string
  canViewComments: boolean
  includeResolved?: boolean
}

export function useDocumentComments({
  orgId,
  documentId,
  projectId,
  canViewComments,
  includeResolved = false,
}: UseDocumentCommentsOptions) {
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!canViewComments) return
    setLoading(true)
    try {
      const res = await collaborationApi.listComments(orgId, documentId, {
        project_id: projectId,
        include_resolved: includeResolved,
      })
      setComments(res.items)
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [orgId, documentId, projectId, canViewComments, includeResolved])

  useEffect(() => {
    void load()
  }, [load])

  const createComment = useCallback(
    async (body: string, mentionedUserIds: string[], parentId?: string) => {
      await collaborationApi.createComment(orgId, documentId, {
        body,
        project_id: projectId,
        parent_id: parentId,
        mentioned_user_ids: mentionedUserIds,
      })
      await load()
    },
    [orgId, documentId, projectId, load]
  )

  const resolveComment = useCallback(
    async (commentId: string) => {
      await collaborationApi.resolveComment(orgId, documentId, commentId, projectId)
      await load()
    },
    [orgId, documentId, projectId, load]
  )

  const reopenComment = useCallback(
    async (commentId: string) => {
      await collaborationApi.reopenComment(orgId, documentId, commentId, projectId)
      await load()
    },
    [orgId, documentId, projectId, load]
  )

  return { comments, loading, load, createComment, resolveComment, reopenComment }
}
