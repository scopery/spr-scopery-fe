import { apiClient } from '@/shared/lib/apiClient'
import { QUOTE_ENDPOINTS } from './endpoints'
import type {
  CreateQuoteLinePayload,
  CreateQuotePayload,
  CreateQuoteTermPayload,
  CreateQuoteVersionPayload,
  Quote,
  QuoteLine,
  QuoteSummary,
  QuoteTerm,
  QuoteVersion,
  SolveTargetMarginPayload,
  SolveTargetMarginResult,
  UpdateQuoteLinePayload,
  UpdateQuotePayload,
  UpdateQuoteTermPayload,
  UpdateQuoteVersionPayload,
} from '../../domain/model/quote'

function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function listQuotes(projectId: string): Promise<Quote[]> {
  const data = await apiClient.get<Quote[] | { items: Quote[] }>(
    QUOTE_ENDPOINTS.quotes.list(projectId)
  )
  return asList(data)
}

export async function createQuote(
  projectId: string,
  body: CreateQuotePayload
): Promise<Quote> {
  return apiClient.post<Quote>(QUOTE_ENDPOINTS.quotes.create(projectId), body)
}

export async function getQuote(projectId: string, quoteId: string): Promise<Quote> {
  return apiClient.get<Quote>(QUOTE_ENDPOINTS.quotes.get(projectId, quoteId))
}

export async function updateQuote(
  projectId: string,
  quoteId: string,
  body: UpdateQuotePayload
): Promise<Quote> {
  return apiClient.put<Quote>(QUOTE_ENDPOINTS.quotes.update(projectId, quoteId), body)
}

export async function archiveQuote(projectId: string, quoteId: string): Promise<Quote> {
  return apiClient.patch<Quote>(QUOTE_ENDPOINTS.quotes.archive(projectId, quoteId), {})
}

export async function listQuoteVersions(
  projectId: string,
  quoteId: string
): Promise<QuoteVersion[]> {
  const data = await apiClient.get<QuoteVersion[] | { items: QuoteVersion[] }>(
    QUOTE_ENDPOINTS.versions.list(projectId, quoteId)
  )
  return asList(data)
}

export async function createQuoteVersion(
  projectId: string,
  quoteId: string,
  body: CreateQuoteVersionPayload
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.create(projectId, quoteId),
    body
  )
}

export async function getQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.get<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.get(projectId, quoteId, versionId)
  )
}

export async function updateQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string,
  body: UpdateQuoteVersionPayload
): Promise<QuoteVersion> {
  return apiClient.put<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.update(projectId, quoteId, versionId),
    body
  )
}

export async function duplicateQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.duplicate(projectId, quoteId, versionId),
    {}
  )
}

export async function archiveQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.patch<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.archive(projectId, quoteId, versionId),
    {}
  )
}

export async function getQuoteVersionSummary(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteSummary> {
  return apiClient.get<QuoteSummary>(
    QUOTE_ENDPOINTS.versions.summary(projectId, quoteId, versionId)
  )
}

export async function recalculateQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteSummary> {
  return apiClient.post<QuoteSummary>(
    QUOTE_ENDPOINTS.versions.recalculate(projectId, quoteId, versionId),
    {}
  )
}

export async function solveTargetMargin(
  projectId: string,
  quoteId: string,
  versionId: string,
  body: SolveTargetMarginPayload
): Promise<SolveTargetMarginResult> {
  return apiClient.post<SolveTargetMarginResult>(
    QUOTE_ENDPOINTS.versions.solveTargetMargin(projectId, quoteId, versionId),
    body
  )
}

export async function submitQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.submit(projectId, quoteId, versionId),
    {}
  )
}

export async function approveQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.approve(projectId, quoteId, versionId),
    {}
  )
}

export async function rejectQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string,
  reason: string
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.reject(projectId, quoteId, versionId),
    { reason }
  )
}

export async function sendQuoteVersion(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.send(projectId, quoteId, versionId),
    {}
  )
}

export async function markQuoteAccepted(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.markAccepted(projectId, quoteId, versionId),
    {}
  )
}

export async function markQuoteVersionCurrent(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteVersion> {
  return apiClient.post<QuoteVersion>(
    QUOTE_ENDPOINTS.versions.markCurrent(projectId, quoteId, versionId),
    {}
  )
}

export async function listQuoteLines(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteLine[]> {
  const data = await apiClient.get<QuoteLine[] | { items: QuoteLine[] }>(
    QUOTE_ENDPOINTS.versions.lines.list(projectId, quoteId, versionId)
  )
  return asList(data)
}

export async function createQuoteLine(
  projectId: string,
  quoteId: string,
  versionId: string,
  body: CreateQuoteLinePayload
): Promise<QuoteLine> {
  return apiClient.post<QuoteLine>(
    QUOTE_ENDPOINTS.versions.lines.create(projectId, quoteId, versionId),
    body
  )
}

export async function updateQuoteLine(
  projectId: string,
  quoteId: string,
  versionId: string,
  lineId: string,
  body: UpdateQuoteLinePayload
): Promise<QuoteLine> {
  return apiClient.put<QuoteLine>(
    QUOTE_ENDPOINTS.versions.lines.update(projectId, quoteId, versionId, lineId),
    body
  )
}

export async function deleteQuoteLine(
  projectId: string,
  quoteId: string,
  versionId: string,
  lineId: string
): Promise<void> {
  await apiClient.delete<void>(
    QUOTE_ENDPOINTS.versions.lines.delete(projectId, quoteId, versionId, lineId),
    { parseJson: false }
  )
}

export async function reorderQuoteLines(
  projectId: string,
  quoteId: string,
  versionId: string,
  lineIds: string[]
): Promise<QuoteLine[]> {
  const data = await apiClient.put<QuoteLine[] | { items: QuoteLine[] }>(
    QUOTE_ENDPOINTS.versions.lines.reorder(projectId, quoteId, versionId),
    { lineIds }
  )
  return asList(data)
}

export async function listQuoteTerms(
  projectId: string,
  quoteId: string,
  versionId: string
): Promise<QuoteTerm[]> {
  const data = await apiClient.get<QuoteTerm[] | { items: QuoteTerm[] }>(
    QUOTE_ENDPOINTS.versions.terms.list(projectId, quoteId, versionId)
  )
  return asList(data)
}

export async function createQuoteTerm(
  projectId: string,
  quoteId: string,
  versionId: string,
  body: CreateQuoteTermPayload
): Promise<QuoteTerm> {
  return apiClient.post<QuoteTerm>(
    QUOTE_ENDPOINTS.versions.terms.create(projectId, quoteId, versionId),
    body
  )
}

export async function updateQuoteTerm(
  projectId: string,
  quoteId: string,
  versionId: string,
  termId: string,
  body: UpdateQuoteTermPayload
): Promise<QuoteTerm> {
  return apiClient.put<QuoteTerm>(
    QUOTE_ENDPOINTS.versions.terms.update(projectId, quoteId, versionId, termId),
    body
  )
}

export async function deleteQuoteTerm(
  projectId: string,
  quoteId: string,
  versionId: string,
  termId: string
): Promise<void> {
  await apiClient.delete<void>(
    QUOTE_ENDPOINTS.versions.terms.delete(projectId, quoteId, versionId, termId),
    { parseJson: false }
  )
}

export async function reorderQuoteTerms(
  projectId: string,
  quoteId: string,
  versionId: string,
  termIds: string[]
): Promise<QuoteTerm[]> {
  const data = await apiClient.put<QuoteTerm[] | { items: QuoteTerm[] }>(
    QUOTE_ENDPOINTS.versions.terms.reorder(projectId, quoteId, versionId),
    { termIds }
  )
  return asList(data)
}
