export const QualityPlanStatus = {
  Draft: 'DRAFT',
  Ready: 'READY',
  Approved: 'APPROVED',
  Current: 'CURRENT',
  Archived: 'ARCHIVED',
} as const
export type QualityPlanStatus =
  (typeof QualityPlanStatus)[keyof typeof QualityPlanStatus]

export const TestLevel = {
  Unit: 'UNIT',
  Integration: 'INTEGRATION',
  System: 'SYSTEM',
  Uat: 'UAT',
  Regression: 'REGRESSION',
  Performance: 'PERFORMANCE',
  Security: 'SECURITY',
  Smoke: 'SMOKE',
  Acceptance: 'ACCEPTANCE',
  Other: 'OTHER',
} as const
export type TestLevel = (typeof TestLevel)[keyof typeof TestLevel]

export const TestCaseType = {
  Functional: 'FUNCTIONAL',
  Negative: 'NEGATIVE',
  Regression: 'REGRESSION',
  Uat: 'UAT',
  Smoke: 'SMOKE',
  Performance: 'PERFORMANCE',
  Security: 'SECURITY',
  Other: 'OTHER',
} as const
export type TestCaseType = (typeof TestCaseType)[keyof typeof TestCaseType]

export const TestCasePriority = {
  Critical: 'CRITICAL',
  High: 'HIGH',
  Medium: 'MEDIUM',
  Low: 'LOW',
} as const
export type TestCasePriority =
  (typeof TestCasePriority)[keyof typeof TestCasePriority]

export const TestRunType = {
  Manual: 'MANUAL',
  Automated: 'AUTOMATED',
  Mixed: 'MIXED',
  Regression: 'REGRESSION',
  Smoke: 'SMOKE',
  Uat: 'UAT',
  Other: 'OTHER',
} as const
export type TestRunType = (typeof TestRunType)[keyof typeof TestRunType]

export const DefectCategory = {
  Functional: 'FUNCTIONAL',
  Ui: 'UI',
  Performance: 'PERFORMANCE',
  Security: 'SECURITY',
  Data: 'DATA',
  Integration: 'INTEGRATION',
  Regression: 'REGRESSION',
  Other: 'OTHER',
} as const
export type DefectCategory = (typeof DefectCategory)[keyof typeof DefectCategory]

export const DefectSeverity = {
  Blocker: 'BLOCKER',
  Critical: 'CRITICAL',
  Major: 'MAJOR',
  Minor: 'MINOR',
  Trivial: 'TRIVIAL',
} as const
export type DefectSeverity =
  (typeof DefectSeverity)[keyof typeof DefectSeverity]

export const DefectPriority = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
} as const
export type DefectPriority =
  (typeof DefectPriority)[keyof typeof DefectPriority]

export const DefectStatus = {
  Open: 'OPEN',
  Triaged: 'TRIAGED',
  Assigned: 'ASSIGNED',
  InProgress: 'IN_PROGRESS',
  Fixed: 'FIXED',
  ReadyForRetest: 'READY_FOR_RETEST',
  Retesting: 'RETESTING',
  Verified: 'VERIFIED',
  Closed: 'CLOSED',
  Rejected: 'REJECTED',
  Reopened: 'REOPENED',
  Archived: 'ARCHIVED',
} as const
export type DefectStatus = (typeof DefectStatus)[keyof typeof DefectStatus]

export const ReleaseType = {
  Major: 'MAJOR',
  Minor: 'MINOR',
  Patch: 'PATCH',
  Hotfix: 'HOTFIX',
  Uat: 'UAT',
  Internal: 'INTERNAL',
  Other: 'OTHER',
} as const
export type ReleaseType = (typeof ReleaseType)[keyof typeof ReleaseType]

export const ReleaseStatus = {
  Draft: 'DRAFT',
  Planned: 'PLANNED',
  InTesting: 'IN_TESTING',
  ReadyForRelease: 'READY_FOR_RELEASE',
  Released: 'RELEASED',
  RolledBack: 'ROLLED_BACK',
  Cancelled: 'CANCELLED',
  Archived: 'ARCHIVED',
} as const
export type ReleaseStatus = (typeof ReleaseStatus)[keyof typeof ReleaseStatus]

export const TraceLinkType = {
  Implements: 'IMPLEMENTS',
  Covers: 'COVERS',
  RelatedTo: 'RELATED_TO',
  DerivedFrom: 'DERIVED_FROM',
  Refines: 'REFINES',
  BlockedBy: 'BLOCKED_BY',
  TestedBy: 'TESTED_BY',
  VerifiedBy: 'VERIFIED_BY',
} as const
export type TraceLinkType = (typeof TraceLinkType)[keyof typeof TraceLinkType]
