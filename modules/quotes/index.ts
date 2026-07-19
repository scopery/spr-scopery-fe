export {
  QuoteStatus,
  QuotePricingMethod,
  QuoteCostBaseMethod,
  QuoteDiscountMethod,
  QuoteLineType,
  QuoteTermType,
  QuoteGenerateLinesFrom,
} from './domain/enums/quote.enum'

export type {
  Quote,
  QuoteVersion,
  QuoteSummary,
  QuoteLine,
  QuoteTerm,
  CreateQuotePayload,
  CreateQuoteVersionPayload,
  SolveTargetMarginResult,
} from './domain/model/quote'

export {
  quoteStatusLabel,
  quoteStatusTone,
  isQuoteEditable,
  isVersionEditable,
  canSubmitVersion,
  canApproveVersion,
  canRejectVersion,
  canSendVersion,
  canMarkAccepted,
  canDuplicateVersion,
  formatPercent,
  pricingMethodLabel,
} from './domain/rules/quote.rules'

export * as quotesApi from './infrastructure/api/quotes.api'

export { useQuotes } from './presentation/hooks/useQuotes'
export {
  useQuoteBuilder,
  type QuoteBuilderSection,
} from './presentation/hooks/useQuoteBuilder'

export { QuotesRegisterView } from './presentation/ui/QuotesRegisterView'
export { QuoteBuilderView } from './presentation/ui/QuoteBuilderView'
export { CreateQuoteModal } from './presentation/ui/CreateQuoteModal'
