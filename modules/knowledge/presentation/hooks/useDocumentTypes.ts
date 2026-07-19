'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/knowledge'
import type { DocumentType } from '../../domain/model/knowledge'

export function useDocumentTypes(_workspaceId?: string | null) {
  const [items, setItems] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDocumentTypes()
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
