export const ScopePackageStatus = {
  Draft: 'DRAFT',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
} as const
export type ScopePackageStatus = (typeof ScopePackageStatus)[keyof typeof ScopePackageStatus]

export const ScopeItemType = {
  Feature: 'FEATURE',
  Workstream: 'WORKSTREAM',
  DeliverableGroup: 'DELIVERABLE_GROUP',
  Constraint: 'CONSTRAINT',
  Assumption: 'ASSUMPTION',
  Exclusion: 'EXCLUSION',
  Other: 'OTHER',
} as const
export type ScopeItemType = (typeof ScopeItemType)[keyof typeof ScopeItemType]

export const ScopeItemPriority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type ScopeItemPriority = (typeof ScopeItemPriority)[keyof typeof ScopeItemPriority]
