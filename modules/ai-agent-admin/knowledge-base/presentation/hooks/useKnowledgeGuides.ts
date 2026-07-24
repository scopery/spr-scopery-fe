'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/knowledge-base.api'
import type { AiGuideDefinition } from '../../domain/model/guide-definition'

export function useKnowledgeGuides() {
  const [items, setItems] = useState<AiGuideDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listGuideDefinitions()
      setItems(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load guides')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}
