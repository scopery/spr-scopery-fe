export const FinanceScenarioStatus = {
  Draft: 'DRAFT',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
} as const
export type FinanceScenarioStatus =
  (typeof FinanceScenarioStatus)[keyof typeof FinanceScenarioStatus]

export const RevenueSplitMethod = {
  EqualSplit: 'EQUAL_SPLIT',
  EffortBased: 'EFFORT_BASED',
  Manual: 'MANUAL',
} as const
export type RevenueSplitMethod =
  (typeof RevenueSplitMethod)[keyof typeof RevenueSplitMethod]

export const CostAdjustmentMethod = {
  Percent: 'PERCENT',
  FixedAmount: 'FIXED_AMOUNT',
  None: 'NONE',
} as const
export type CostAdjustmentMethod =
  (typeof CostAdjustmentMethod)[keyof typeof CostAdjustmentMethod]

export const CostLineStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type CostLineStatus = (typeof CostLineStatus)[keyof typeof CostLineStatus]
