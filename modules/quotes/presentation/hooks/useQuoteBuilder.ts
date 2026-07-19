'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as quotesApi from '../../infrastructure/api/quotes.api'
import type {
  CreateQuoteLinePayload,
  CreateQuoteTermPayload,
  CreateQuoteVersionPayload,
  Quote,
  QuoteLine,
  QuoteSummary,
  QuoteTerm,
  QuoteVersion,
  SolveTargetMarginPayload,
  SolveTargetMarginResult,
  UpdateQuotePayload,
  UpdateQuoteVersionPayload,
} from '../../domain/model/quote'

export type QuoteBuilderSection =
  | 'pricing'
  | 'lines'
  | 'terms'
  | 'client'
  | 'proposal'
  | 'preview'
  | 'summary'

export function useQuoteBuilder(projectId: string | null, quoteId: string | null) {
  const [section, setSection] = useState<QuoteBuilderSection>('lines')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [versions, setVersions] = useState<QuoteVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [version, setVersion] = useState<QuoteVersion | null>(null)
  const [summary, setSummary] = useState<QuoteSummary | null>(null)
  const [lines, setLines] = useState<QuoteLine[]>([])
  const [terms, setTerms] = useState<QuoteTerm[]>([])
  const [solverResult, setSolverResult] = useState<SolveTargetMarginResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const loadQuote = useCallback(async () => {
    if (!projectId || !quoteId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [q, vers] = await Promise.all([
        quotesApi.getQuote(projectId, quoteId),
        quotesApi.listQuoteVersions(projectId, quoteId),
      ])
      setQuote(q)
      setVersions(vers)
      const current =
        vers.find((v) => v.currentFlag)?.id ??
        q.currentVersionId ??
        vers[0]?.id ??
        null
      setSelectedVersionId((prev) => prev ?? current)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load quote')
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, quoteId])

  useEffect(() => {
    void loadQuote()
  }, [loadQuote])

  const loadVersionBundle = useCallback(async () => {
    if (!projectId || !quoteId || !selectedVersionId) {
      setVersion(null)
      setSummary(null)
      setLines([])
      setTerms([])
      return
    }
    try {
      const [v, sum, lineList, termList] = await Promise.all([
        quotesApi.getQuoteVersion(projectId, quoteId, selectedVersionId),
        quotesApi.getQuoteVersionSummary(projectId, quoteId, selectedVersionId).catch(() => null),
        quotesApi.listQuoteLines(projectId, quoteId, selectedVersionId),
        quotesApi.listQuoteTerms(projectId, quoteId, selectedVersionId),
      ])
      setVersion(v)
      setSummary(sum)
      setLines([...lineList].sort((a, b) => a.displayOrder - b.displayOrder))
      setTerms([...termList].sort((a, b) => a.displayOrder - b.displayOrder))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version')
    }
  }, [projectId, quoteId, selectedVersionId])

  useEffect(() => {
    void loadVersionBundle()
  }, [loadVersionBundle])

  const refreshVersions = useCallback(async () => {
    if (!projectId || !quoteId) return
    const vers = await quotesApi.listQuoteVersions(projectId, quoteId)
    setVersions(vers)
    const q = await quotesApi.getQuote(projectId, quoteId)
    setQuote(q)
  }, [projectId, quoteId])

  const updateQuoteMeta = useCallback(
    async (body: UpdateQuotePayload) => {
      if (!projectId || !quoteId) return null
      const updated = await quotesApi.updateQuote(projectId, quoteId, body)
      setQuote(updated)
      return updated
    },
    [projectId, quoteId]
  )

  const createVersion = useCallback(
    async (body: CreateQuoteVersionPayload) => {
      if (!projectId || !quoteId) return null
      const created = await quotesApi.createQuoteVersion(projectId, quoteId, body)
      await refreshVersions()
      setSelectedVersionId(created.id)
      return created
    },
    [projectId, quoteId, refreshVersions]
  )

  const updateVersion = useCallback(
    async (body: UpdateQuoteVersionPayload) => {
      if (!projectId || !quoteId || !selectedVersionId) return null
      const updated = await quotesApi.updateQuoteVersion(
        projectId,
        quoteId,
        selectedVersionId,
        body
      )
      setVersion(updated)
      await refreshVersions()
      return updated
    },
    [projectId, quoteId, selectedVersionId, refreshVersions]
  )

  const duplicateVersion = useCallback(async () => {
    if (!projectId || !quoteId || !selectedVersionId) return null
    const created = await quotesApi.duplicateQuoteVersion(
      projectId,
      quoteId,
      selectedVersionId
    )
    await refreshVersions()
    setSelectedVersionId(created.id)
    return created
  }, [projectId, quoteId, selectedVersionId, refreshVersions])

  const recalculate = useCallback(async () => {
    if (!projectId || !quoteId || !selectedVersionId) return null
    setRecalculating(true)
    try {
      const sum = await quotesApi.recalculateQuoteVersion(
        projectId,
        quoteId,
        selectedVersionId
      )
      setSummary(sum)
      return sum
    } finally {
      setRecalculating(false)
    }
  }, [projectId, quoteId, selectedVersionId])

  const solveMargin = useCallback(
    async (body: SolveTargetMarginPayload) => {
      if (!projectId || !quoteId || !selectedVersionId) return null
      const result = await quotesApi.solveTargetMargin(
        projectId,
        quoteId,
        selectedVersionId,
        body
      )
      setSolverResult(result)
      return result
    },
    [projectId, quoteId, selectedVersionId]
  )

  const lifecycle = useCallback(
    async (
      action:
        | 'submit'
        | 'approve'
        | 'reject'
        | 'send'
        | 'accept'
        | 'markCurrent'
        | 'archive',
      reason?: string
    ) => {
      if (!projectId || !quoteId || !selectedVersionId) return null
      let result: QuoteVersion
      switch (action) {
        case 'submit':
          result = await quotesApi.submitQuoteVersion(projectId, quoteId, selectedVersionId)
          break
        case 'approve':
          result = await quotesApi.approveQuoteVersion(projectId, quoteId, selectedVersionId)
          break
        case 'reject':
          result = await quotesApi.rejectQuoteVersion(
            projectId,
            quoteId,
            selectedVersionId,
            reason ?? ''
          )
          break
        case 'send':
          result = await quotesApi.sendQuoteVersion(projectId, quoteId, selectedVersionId)
          break
        case 'accept':
          result = await quotesApi.markQuoteAccepted(projectId, quoteId, selectedVersionId)
          break
        case 'markCurrent':
          result = await quotesApi.markQuoteVersionCurrent(
            projectId,
            quoteId,
            selectedVersionId
          )
          break
        case 'archive':
          result = await quotesApi.archiveQuoteVersion(
            projectId,
            quoteId,
            selectedVersionId
          )
          break
      }
      await refreshVersions()
      await loadVersionBundle()
      return result
    },
    [projectId, quoteId, selectedVersionId, refreshVersions, loadVersionBundle]
  )

  const addLine = useCallback(
    async (body: CreateQuoteLinePayload) => {
      if (!projectId || !quoteId || !selectedVersionId) return null
      const created = await quotesApi.createQuoteLine(
        projectId,
        quoteId,
        selectedVersionId,
        body
      )
      await loadVersionBundle()
      return created
    },
    [projectId, quoteId, selectedVersionId, loadVersionBundle]
  )

  const removeLine = useCallback(
    async (lineId: string) => {
      if (!projectId || !quoteId || !selectedVersionId) return
      await quotesApi.deleteQuoteLine(projectId, quoteId, selectedVersionId, lineId)
      await loadVersionBundle()
    },
    [projectId, quoteId, selectedVersionId, loadVersionBundle]
  )

  const addTerm = useCallback(
    async (body: CreateQuoteTermPayload) => {
      if (!projectId || !quoteId || !selectedVersionId) return null
      const created = await quotesApi.createQuoteTerm(
        projectId,
        quoteId,
        selectedVersionId,
        body
      )
      await loadVersionBundle()
      return created
    },
    [projectId, quoteId, selectedVersionId, loadVersionBundle]
  )

  const removeTerm = useCallback(
    async (termId: string) => {
      if (!projectId || !quoteId || !selectedVersionId) return
      await quotesApi.deleteQuoteTerm(projectId, quoteId, selectedVersionId, termId)
      await loadVersionBundle()
    },
    [projectId, quoteId, selectedVersionId, loadVersionBundle]
  )

  return {
    section,
    setSection,
    quote,
    versions,
    selectedVersionId,
    setSelectedVersionId,
    version,
    summary,
    lines,
    terms,
    solverResult,
    setSolverResult,
    loading,
    recalculating,
    error,
    forbidden,
    refetch: loadQuote,
    updateQuoteMeta,
    createVersion,
    updateVersion,
    duplicateVersion,
    recalculate,
    solveMargin,
    lifecycle,
    addLine,
    removeLine,
    addTerm,
    removeTerm,
  }
}
