export const ProfitHealthStatus = {
  Healthy: 'HEALTHY',
  Watch: 'WATCH',
  AtRisk: 'AT_RISK',
  LossRisk: 'LOSS_RISK',
} as const
export type ProfitHealthStatus =
  (typeof ProfitHealthStatus)[keyof typeof ProfitHealthStatus]

export const ProfitRateType = {
  RoleBased: 'ROLE_BASED',
  Individual: 'INDIVIDUAL',
  Flat: 'FLAT',
} as const
export type ProfitRateType = (typeof ProfitRateType)[keyof typeof ProfitRateType]

export const ProfitEntityStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
  Draft: 'DRAFT',
} as const
export type ProfitEntityStatus =
  (typeof ProfitEntityStatus)[keyof typeof ProfitEntityStatus]

export const CostSourceType = {
  Labor: 'LABOR',
  Vendor: 'VENDOR',
  Overhead: 'OVERHEAD',
  Custom: 'CUSTOM',
} as const
export type CostSourceType = (typeof CostSourceType)[keyof typeof CostSourceType]

export const RevenueSourceType = {
  Contract: 'CONTRACT',
  Milestone: 'MILESTONE',
  ChangeOrder: 'CHANGE_ORDER',
  Other: 'OTHER',
} as const
export type RevenueSourceType =
  (typeof RevenueSourceType)[keyof typeof RevenueSourceType]

export const CostForecastType = {
  Labor: 'LABOR',
  Vendor: 'VENDOR',
  Overhead: 'OVERHEAD',
  Custom: 'CUSTOM',
} as const
export type CostForecastType = (typeof CostForecastType)[keyof typeof CostForecastType]

export const RevenueForecastType = {
  Contract: 'CONTRACT',
  Milestone: 'MILESTONE',
  ChangeOrder: 'CHANGE_ORDER',
  Estimate: 'ESTIMATE',
} as const
export type RevenueForecastType =
  (typeof RevenueForecastType)[keyof typeof RevenueForecastType]

export const ProfitPlanType = {
  Budget: 'BUDGET',
  Forecast: 'FORECAST',
  Actuals: 'ACTUALS',
  Scenario: 'SCENARIO',
} as const
export type ProfitPlanType = (typeof ProfitPlanType)[keyof typeof ProfitPlanType]

export const AdjustmentType = {
  CostReduction: 'COST_REDUCTION',
  RevenueUplift: 'REVENUE_UPLIFT',
  MarginAdjustment: 'MARGIN_ADJUSTMENT',
} as const
export type AdjustmentType = (typeof AdjustmentType)[keyof typeof AdjustmentType]

export const VarianceType = {
  CostOverrun: 'COST_OVERRUN',
  RevenueShortfall: 'REVENUE_SHORTFALL',
  MarginErosion: 'MARGIN_EROSION',
  ScheduleImpact: 'SCHEDULE_IMPACT',
} as const
export type VarianceType = (typeof VarianceType)[keyof typeof VarianceType]

export const ProfitRiskImpactType = {
  MarginErosion: 'MARGIN_EROSION',
  CashFlowRisk: 'CASH_FLOW_RISK',
  RevenueAtRisk: 'REVENUE_AT_RISK',
  CostOverrun: 'COST_OVERRUN',
} as const
export type ProfitRiskImpactType =
  (typeof ProfitRiskImpactType)[keyof typeof ProfitRiskImpactType]
