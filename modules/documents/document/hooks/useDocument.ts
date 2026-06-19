'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Document } from '../model/document'
import * as documentDetailApi from '../api/document-detail.api'

export function useDocument(orgId: string | null, documentId: string | null) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !documentId) return
    setLoading(true)
    setError(null)
    try {
      const data = await documentDetailApi.getDocument(orgId, documentId)
      setDocument(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [orgId, documentId])

  useEffect(() => {
    void load()
  }, [load])

  return { document, loading, error, refetch: load }
}
