'use client'

import { useCallback, useEffect, useState } from 'react'
import * as knowledgeApi from '../../infrastructure/api/knowledge'

export function useKnowledgeGraph() {
  const [related, setRelated] = useState<Array<{ id: string; title: string; type: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRelated = useCallback(async (entityId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await knowledgeApi.listRelatedEntities(entityId)
      setRelated(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load related entities')
      setRelated([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setRelated([])
    setError(null)
  }, [])

  return { related, loading, error, loadRelated, clear }
}
