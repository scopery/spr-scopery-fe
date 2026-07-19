export const RaidItemType = {
  Risk: 'RISK',
  Assumption: 'ASSUMPTION',
  Issue: 'ISSUE',
  Dependency: 'DEPENDENCY',
} as const
export type RaidItemType = (typeof RaidItemType)[keyof typeof RaidItemType]

export const RaidItemStatus = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Closed: 'CLOSED',
  Escalated: 'ESCALATED',
  Archived: 'ARCHIVED',
} as const
export type RaidItemStatus = (typeof RaidItemStatus)[keyof typeof RaidItemStatus]

export const RaidRiskProbability = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
} as const
export type RaidRiskProbability = (typeof RaidRiskProbability)[keyof typeof RaidRiskProbability]

export const RaidRiskImpact = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
} as const
export type RaidRiskImpact = (typeof RaidRiskImpact)[keyof typeof RaidRiskImpact]

export const RaidRiskResponseStrategy = {
  Mitigate: 'MITIGATE',
  Avoid: 'AVOID',
  Transfer: 'TRANSFER',
  Accept: 'ACCEPT',
} as const
export type RaidRiskResponseStrategy =
  (typeof RaidRiskResponseStrategy)[keyof typeof RaidRiskResponseStrategy]

export const RaidIssueSeverity = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type RaidIssueSeverity = (typeof RaidIssueSeverity)[keyof typeof RaidIssueSeverity]

export const RaidValidationStatus = {
  Unvalidated: 'UNVALIDATED',
  Validated: 'VALIDATED',
  Invalidated: 'INVALIDATED',
} as const
export type RaidValidationStatus = (typeof RaidValidationStatus)[keyof typeof RaidValidationStatus]

export const RaidDependencyType = {
  Internal: 'INTERNAL',
  External: 'EXTERNAL',
} as const
export type RaidDependencyType = (typeof RaidDependencyType)[keyof typeof RaidDependencyType]
