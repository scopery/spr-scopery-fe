export const BaselineStatus = {
  Draft: 'DRAFT',
  Validated: 'VALIDATED',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
} as const
export type BaselineStatus = (typeof BaselineStatus)[keyof typeof BaselineStatus]

export const ChangeRequestStatus = {
  Draft: 'DRAFT',
  Submitted: 'SUBMITTED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
  Applied: 'APPLIED',
  Archived: 'ARCHIVED',
} as const
export type ChangeRequestStatus =
  (typeof ChangeRequestStatus)[keyof typeof ChangeRequestStatus]

export const ChangeType = {
  ScopeAddition: 'SCOPE_ADDITION',
  ScopeReduction: 'SCOPE_REDUCTION',
  CostChange: 'COST_CHANGE',
  ScheduleChange: 'SCHEDULE_CHANGE',
  RiskAdjustment: 'RISK_ADJUSTMENT',
} as const
export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType]

export const ChangePriority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type ChangePriority = (typeof ChangePriority)[keyof typeof ChangePriority]

export const ChangeItemOperation = {
  Add: 'ADD',
  Modify: 'MODIFY',
  Remove: 'REMOVE',
} as const
export type ChangeItemOperation =
  (typeof ChangeItemOperation)[keyof typeof ChangeItemOperation]

export const ScopeImpact = {
  Increase: 'INCREASE',
  Decrease: 'DECREASE',
  Neutral: 'NEUTRAL',
} as const
export type ScopeImpact = (typeof ScopeImpact)[keyof typeof ScopeImpact]

export const RiskImpact = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type RiskImpact = (typeof RiskImpact)[keyof typeof RiskImpact]

export const ChangeOrderStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Archived: 'ARCHIVED',
} as const
export type ChangeOrderStatus =
  (typeof ChangeOrderStatus)[keyof typeof ChangeOrderStatus]
