import { QuoteStatus } from '../enums/quote.enum'
import type { Quote, QuoteVersion } from '../model/quote'

export function quoteStatusLabel(status: string): string {
  switch (status) {
    case QuoteStatus.Draft:
      return 'Draft'
    case QuoteStatus.Submitted:
      return 'Submitted'
    case QuoteStatus.Approved:
      return 'Approved'
    case QuoteStatus.Rejected:
      return 'Rejected'
    case QuoteStatus.Sent:
      return 'Sent'
    case QuoteStatus.Accepted:
      return 'Accepted'
    case QuoteStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function quoteStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'progress' {
  switch (status) {
    case QuoteStatus.Draft:
      return 'info'
    case QuoteStatus.Submitted:
      return 'progress'
    case QuoteStatus.Approved:
    case QuoteStatus.Accepted:
      return 'success'
    case QuoteStatus.Rejected:
      return 'error'
    case QuoteStatus.Sent:
      return 'warning'
    case QuoteStatus.Archived:
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function isQuoteEditable(quote: Quote): boolean {
  return quote.status === QuoteStatus.Draft && !quote.archivedAt
}

export function isVersionEditable(version: QuoteVersion): boolean {
  return version.status === QuoteStatus.Draft && !version.archivedAt
}

export function canSubmitVersion(version: QuoteVersion): boolean {
  return version.status === QuoteStatus.Draft
}

export function canApproveVersion(version: QuoteVersion): boolean {
  return version.status === QuoteStatus.Submitted
}

export function canRejectVersion(version: QuoteVersion): boolean {
  return version.status === QuoteStatus.Submitted
}

export function canSendVersion(version: QuoteVersion): boolean {
  return version.status === QuoteStatus.Approved
}

export function canMarkAccepted(version: QuoteVersion): boolean {
  return version.status === QuoteStatus.Sent
}

export function canDuplicateVersion(version: QuoteVersion): boolean {
  return version.status !== QuoteStatus.Archived
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

export function pricingMethodLabel(method: string): string {
  switch (method) {
    case 'COST_PLUS_MARGIN':
      return 'Cost + margin'
    case 'FIXED_PRICE':
      return 'Fixed price'
    case 'TIME_AND_MATERIALS':
      return 'Time & materials'
    default:
      return method
  }
}
