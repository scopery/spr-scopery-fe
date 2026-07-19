'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as commentApi from '../api/document-comment.api'
import type { DocumentCommentThread } from '../model/collaboration'

export function useDocumentCommentThreads(projectId: string, documentId: string) {
  const [items, setItems] = useState<DocumentCommentThread[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !documentId) return
    setLoading(true)
    setError(null)
    try {
      const res = await commentApi.listCommentThreads(projectId, documentId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    void load()
  }, [load])

  const createThread = useCallback(async () => {
    const body = draft.trim()
    if (!body) return
    setSubmitting(true)
    try {
      await commentApi.createCommentThread(projectId, documentId, {
        firstCommentBody: body,
        anchorText: body.slice(0, 80),
      })
      setDraft('')
      toast.success('Comment added')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSubmitting(false)
    }
  }, [projectId, documentId, draft, load])

  const resolve = useCallback(
    async (threadId: string) => {
      try {
        await commentApi.resolveCommentThread(projectId, documentId, threadId)
        toast.success('Thread resolved')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      }
    },
    [projectId, documentId, load]
  )

  const reply = useCallback(
    async (threadId: string, body: string) => {
      const text = body.trim()
      if (!text) return
      try {
        await commentApi.addCommentToThread(projectId, documentId, threadId, { body: text })
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      }
    },
    [projectId, documentId, load]
  )

  return {
    items,
    loading,
    error,
    draft,
    setDraft,
    submitting,
    createThread,
    resolve,
    reply,
    refetch: load,
  }
}
