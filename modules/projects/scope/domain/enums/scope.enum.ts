export const ScopePackageStatus = {
  Draft: 'DRAFT',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
} as const
export type ScopePackageStatus = (typeof ScopePackageStatus)[keyof typeof ScopePackageStatus]

export const ScopeItemType = {
  Functional: 'FUNCTIONAL',
  NonFunctional: 'NON_FUNCTIONAL',
  Technical: 'TECHNICAL',
  Integration: 'INTEGRATION',
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
