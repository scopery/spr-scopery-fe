'use client'

import { useCallback, useState } from 'react'
import * as productivityApi from '../../infrastructure/api/productivity.api'
import type { SearchResultItem } from '../../domain/model/search'

export function useGlobalSearch(workspaceId?: string | null) {
  const [items, setItems] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const search = useCallback(
    async (q: string) => {
      setQuery(q)
      if (!q.trim()) {
        setItems([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await productivityApi.searchGlobal({
          q: q.trim(),
          workspaceId: workspaceId ?? undefined,
          limit: 20,
        })
        setItems(res.items ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [workspaceId]
  )

  return { items, loading, error, query, search }
}
