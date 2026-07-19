'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as suggestionApi from '../api/document-suggestion.api'
import type { DocumentSuggestion } from '../model/collaboration'

export function useDocumentSuggestions(
  projectId: string,
  documentId: string,
  onAccepted?: () => void
) {
  const [items, setItems] = useState<DocumentSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !documentId) return
    setLoading(true)
    setError(null)
    try {
      const res = await suggestionApi.listSuggestions(projectId, documentId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    void load()
  }, [load])

  const accept = useCallback(
    async (suggestionId: string) => {
      try {
        await suggestionApi.acceptSuggestion(projectId, documentId, suggestionId)
        toast.success('Suggestion accepted')
        await load()
        onAccepted?.()
      } catch (err) {
        const code = getProblemCode(err)
        if (err instanceof ApiError && err.status === 409) {
          toast.error(
            code === 'SUGGESTION_BASE_REVISION_CONFLICT'
              ? 'Document changed — suggestion is stale. Reject or recreate it.'
              : getProblemToastMessage(err)
          )
          return
        }
        toast.error(getProblemToastMessage(err))
      }
    },
    [projectId, documentId, load, onAccepted]
  )

  const reject = useCallback(
    async (suggestionId: string) => {
      try {
        await suggestionApi.rejectSuggestion(projectId, documentId, suggestionId)
        toast.success('Suggestion rejected')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      }
    },
    [projectId, documentId, load]
  )

  return { items, loading, error, accept, reject, refetch: load }
}
