'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as quotesApi from '../../infrastructure/api/quotes.api'
import type { CreateQuotePayload, Quote, QuoteSummary } from '../../domain/model/quote'

export interface QuoteListItem extends Quote {
  summary?: QuoteSummary | null
}

export function useQuotes(projectId: string | null) {
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const list = await quotesApi.listQuotes(projectId)
      const withSummaries = await Promise.all(
        list.map(async (q) => {
          if (!q.currentVersionId) return { ...q, summary: null }
          try {
            const summary = await quotesApi.getQuoteVersionSummary(
              projectId,
              q.id,
              q.currentVersionId
            )
            return { ...q, summary }
          } catch {
            return { ...q, summary: null }
          }
        })
      )
      setQuotes(withSummaries)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load quotes')
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (body: CreateQuotePayload) => {
      if (!projectId) return null
      setCreating(true)
      try {
        const created = await quotesApi.createQuote(projectId, body)
        await load()
        return created
      } finally {
        setCreating(false)
      }
    },
    [projectId, load]
  )

  const archive = useCallback(
    async (quoteId: string) => {
      if (!projectId) return null
      const result = await quotesApi.archiveQuote(projectId, quoteId)
      await load()
      return result
    },
    [projectId, load]
  )

  const filtered =
    statusFilter === 'all'
      ? quotes
      : quotes.filter((q) => q.status === statusFilter)

  return {
    quotes: filtered,
    allQuotes: quotes,
    loading,
    creating,
    error,
    forbidden,
    statusFilter,
    setStatusFilter,
    refetch: load,
    create,
    archive,
  }
}
