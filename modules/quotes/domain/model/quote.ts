import type {
  QuoteCostBaseMethod,
  QuoteDiscountMethod,
  QuoteGenerateLinesFrom,
  QuoteLineType,
  QuotePricingMethod,
  QuoteStatus,
  QuoteTermType,
} from '../enums/quote.enum'

export interface CreateQuotePayload {
  code: string
  title: string
  description?: string | null
  sourceFinanceScenarioId?: string | null
  clientName?: string | null
  clientCompany?: string | null
  clientEmail?: string | null
  clientContactName?: string | null
  clientReference?: string | null
}

export interface UpdateQuotePayload {
  title?: string
  description?: string | null
  clientName?: string | null
  clientCompany?: string | null
  clientEmail?: string | null
  clientContactName?: string | null
  clientReference?: string | null
}

export interface Quote {
  id: string
  projectId: string
  workspaceId: string
  sourceFinanceScenarioId: string | null
  code: string
  title: string
  description: string | null
  clientName: string | null
  clientCompany: string | null
  clientEmail: string | null
  clientContactName: string | null
  clientReference: string | null
  status: QuoteStatus | string
  currentVersionId: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateQuoteVersionPayload {
  financeScenarioId?: string | null
  pricingMethod: QuotePricingMethod
  costBaseMethod: QuoteCostBaseMethod
  targetMarginPercent?: number | null
  generateLinesFrom?: QuoteGenerateLinesFrom | string
  validUntil?: string | null
  proposalTitle?: string | null
  proposalNotes?: string | null
  discountMethod?: QuoteDiscountMethod
  discountPercent?: number | null
  discountAmount?: number | null
  discountReason?: string | null
}

export interface UpdateQuoteVersionPayload {
  pricingMethod?: QuotePricingMethod
  costBaseMethod?: QuoteCostBaseMethod
  targetMarginPercent?: number | null
  validUntil?: string | null
  proposalTitle?: string | null
  proposalNotes?: string | null
  discountMethod?: QuoteDiscountMethod
  discountPercent?: number | null
  discountAmount?: number | null
  discountReason?: string | null
  financeScenarioId?: string | null
}

export interface QuoteVersion {
  id: string
  quoteId: string
  versionNumber: number
  status: QuoteStatus | string
  pricingMethod: QuotePricingMethod | string
  costBaseMethod?: QuoteCostBaseMethod | string
  targetMarginPercent: number | null
  discountMethod: QuoteDiscountMethod | string | null
  discountPercent: number | null
  discountAmount: number | null
  discountReason?: string | null
  validUntil: string | null
  proposalTitle?: string | null
  proposalNotes?: string | null
  financeScenarioId?: string | null
  currentFlag: boolean
  submittedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  sentAt: string | null
  acceptedAt: string | null
  archivedAt: string | null
  createdAt?: string
  updatedAt?: string
}

export interface QuoteSummary {
  id: string
  quoteVersionId: string
  projectId: string
  currencyCode: string
  costBase: number
  directCost: number
  overhead: number
  subtotalBeforeDiscount: number
  discountMethod: string | null
  discountPercent: number | null
  discountAmount: number | null
  subtotalAfterDiscount: number
  taxMode: string | null
  taxAmount: number
  totalQuotedAmount: number
  targetMarginPercent: number | null
  requiredContractValue: number | null
  grossMargin: number
  grossMarginPercent: number
  profitBeforeTax: number
  pbtPercent: number
  formulaVersion: string | null
}

export interface SolveTargetMarginPayload {
  costBase: number
  targetMarginPercent: number
  currencyCode: string
}

export interface SolveTargetMarginResult {
  costBase: number
  targetMarginPercent: number
  requiredContractValue: number
  currencyCode: string
}

export interface QuoteLine {
  id: string
  quoteVersionId: string
  projectId: string
  sourceProjectPhaseId: string | null
  lineType: QuoteLineType | string
  name: string
  description: string | null
  quantity: number
  unitPrice: number
  amount: number
  currencyCode: string
  displayOrder: number
  clientVisible: boolean
  internalNote: string | null
}

export interface CreateQuoteLinePayload {
  lineType: QuoteLineType
  name: string
  description?: string | null
  quantity: number
  unitPrice: number
  displayOrder?: number
  clientVisible?: boolean
  internalNote?: string | null
  sourceProjectPhaseId?: string | null
}

export interface UpdateQuoteLinePayload {
  lineType?: QuoteLineType
  name?: string
  description?: string | null
  quantity?: number
  unitPrice?: number
  displayOrder?: number
  clientVisible?: boolean
  internalNote?: string | null
}

export interface QuoteTerm {
  id: string
  quoteVersionId: string
  termType: QuoteTermType | string
  title: string
  content: string
  displayOrder: number
  clientVisible: boolean
}

export interface CreateQuoteTermPayload {
  termType: QuoteTermType
  title: string
  content: string
  displayOrder?: number
  clientVisible?: boolean
}

export interface UpdateQuoteTermPayload {
  termType?: QuoteTermType
  title?: string
  content?: string
  displayOrder?: number
  clientVisible?: boolean
}
