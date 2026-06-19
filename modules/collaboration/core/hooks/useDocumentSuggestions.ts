'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as collaborationApi from '../api/collaboration.api'
import type { DocumentSuggestion } from '../model/collaboration'

interface UseDocumentSuggestionsOptions {
  orgId: string
  documentId: string
  projectId?: string
  canViewSuggestions: boolean
  includeClosed?: boolean
}

export function useDocumentSuggestions({
  orgId,
  documentId,
  projectId,
  canViewSuggestions,
  includeClosed = true,
}: UseDocumentSuggestionsOptions) {
  const [suggestions, setSuggestions] = useState<DocumentSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!canViewSuggestions) return
    setLoading(true)
    try {
      const res = await collaborationApi.listSuggestions(orgId, documentId, {
        project_id: projectId,
        include_closed: includeClosed,
      })
      setSuggestions(res.items)
    } catch {
      toast.error('Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }, [orgId, documentId, projectId, canViewSuggestions, includeClosed])

  useEffect(() => {
    void load()
  }, [load])

  const createSuggestion = useCallback(
    async (title: string | null, description: string, mentionedUserIds: string[]) => {
      await collaborationApi.createSuggestion(orgId, documentId, {
        title,
        description,
        project_id: projectId,
        mentioned_user_ids: mentionedUserIds,
      })
      await load()
    },
    [orgId, documentId, projectId, load]
  )

  const acceptSuggestion = useCallback(
    async (suggestionId: string) => {
      await collaborationApi.acceptSuggestion(orgId, documentId, suggestionId, projectId)
      await load()
    },
    [orgId, documentId, projectId, load]
  )

  const rejectSuggestion = useCallback(
    async (suggestionId: string) => {
      await collaborationApi.rejectSuggestion(orgId, documentId, suggestionId, projectId)
      await load()
    },
    [orgId, documentId, projectId, load]
  )

  return {
    suggestions,
    loading,
    load,
    createSuggestion,
    acceptSuggestion,
    rejectSuggestion,
  }
}
