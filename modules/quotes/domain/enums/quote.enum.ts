export const QuoteStatus = {
  Draft: 'DRAFT',
  Submitted: 'SUBMITTED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Sent: 'SENT',
  Accepted: 'ACCEPTED',
  Archived: 'ARCHIVED',
} as const
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus]

export const QuotePricingMethod = {
  CostPlusMargin: 'COST_PLUS_MARGIN',
  FixedPrice: 'FIXED_PRICE',
  TimeAndMaterials: 'TIME_AND_MATERIALS',
} as const
export type QuotePricingMethod =
  (typeof QuotePricingMethod)[keyof typeof QuotePricingMethod]

export const QuoteCostBaseMethod = {
  TotalCost: 'TOTAL_COST',
  LaborOnly: 'LABOR_ONLY',
  DirectCost: 'DIRECT_COST',
} as const
export type QuoteCostBaseMethod =
  (typeof QuoteCostBaseMethod)[keyof typeof QuoteCostBaseMethod]

export const QuoteDiscountMethod = {
  Percent: 'PERCENT',
  FixedAmount: 'FIXED_AMOUNT',
  None: 'NONE',
} as const
export type QuoteDiscountMethod =
  (typeof QuoteDiscountMethod)[keyof typeof QuoteDiscountMethod]

export const QuoteLineType = {
  Phase: 'PHASE',
  Milestone: 'MILESTONE',
  License: 'LICENSE',
  Custom: 'CUSTOM',
  Discount: 'DISCOUNT',
} as const
export type QuoteLineType = (typeof QuoteLineType)[keyof typeof QuoteLineType]

export const QuoteTermType = {
  Payment: 'PAYMENT',
  Warranty: 'WARRANTY',
  Delivery: 'DELIVERY',
  Scope: 'SCOPE',
  Legal: 'LEGAL',
  Custom: 'CUSTOM',
} as const
export type QuoteTermType = (typeof QuoteTermType)[keyof typeof QuoteTermType]

export const QuoteGenerateLinesFrom = {
  Phases: 'PHASES',
  Milestones: 'MILESTONES',
  Manual: 'MANUAL',
} as const
export type QuoteGenerateLinesFrom =
  (typeof QuoteGenerateLinesFrom)[keyof typeof QuoteGenerateLinesFrom]
