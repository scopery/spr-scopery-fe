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

/** Aligned with BE `changerequest.domain.enums.ChangeType` (+ live OpenAPI). */
export const ChangeType = {
  ScopeChange: 'SCOPE_CHANGE',
  ScheduleChange: 'SCHEDULE_CHANGE',
  CostChange: 'COST_CHANGE',
  RevenueChange: 'REVENUE_CHANGE',
  QuoteChange: 'QUOTE_CHANGE',
  ResourceChange: 'RESOURCE_CHANGE',
  RiskResponse: 'RISK_RESPONSE',
  Other: 'OTHER',
} as const
export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType]

export const ChangePriority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type ChangePriority = (typeof ChangePriority)[keyof typeof ChangePriority]

/** Aligned with BE `changerequestitem.domain.enums.ChangeItemOperation`. */
export const ChangeItemOperation = {
  Create: 'CREATE',
  Update: 'UPDATE',
  Delete: 'DELETE',
  Archive: 'ARCHIVE',
  Move: 'MOVE',
  Recalculate: 'RECALCULATE',
  ReplaceReference: 'REPLACE_REFERENCE',
} as const
export type ChangeItemOperation =
  (typeof ChangeItemOperation)[keyof typeof ChangeItemOperation]

/** Aligned with BE `changerequestitem.domain.enums.ChangeItemTargetType`. */
export const ChangeItemTargetType = {
  Project: 'PROJECT',
  ProjectPhase: 'PROJECT_PHASE',
  WbsNode: 'WBS_NODE',
  Task: 'TASK',
  TaskDependency: 'TASK_DEPENDENCY',
  Milestone: 'MILESTONE',
  Schedule: 'SCHEDULE',
  Estimate: 'ESTIMATE',
  FinanceScenario: 'FINANCE_SCENARIO',
  QuoteVersion: 'QUOTE_VERSION',
  CustomCost: 'CUSTOM_COST',
  VendorCost: 'VENDOR_COST',
  Function: 'FUNCTION',
  Other: 'OTHER',
} as const
export type ChangeItemTargetType =
  (typeof ChangeItemTargetType)[keyof typeof ChangeItemTargetType]

export const ChangeItemStatus = {
  Draft: 'DRAFT',
  Ready: 'READY',
  Applied: 'APPLIED',
  Failed: 'FAILED',
  Skipped: 'SKIPPED',
} as const
export type ChangeItemStatus = (typeof ChangeItemStatus)[keyof typeof ChangeItemStatus]

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

/** Areas impacted by a proposed change item (stored as JSONB list on BE — free strings). */
export const AffectedArea = {
  AcceptanceCriteria: 'ACCEPTANCE_CRITERIA',
  BusinessRules: 'BUSINESS_RULES',
  Screens: 'SCREENS',
  Api: 'API',
  Data: 'DATA',
  Estimate: 'ESTIMATE',
  Dates: 'DATES',
  Assignment: 'ASSIGNMENT',
} as const
export type AffectedArea = (typeof AffectedArea)[keyof typeof AffectedArea]
