export const QualityPlanStatus = {
  Draft: 'DRAFT',
  Ready: 'READY',
  Approved: 'APPROVED',
  Current: 'CURRENT',
  Archived: 'ARCHIVED',
} as const
export type QualityPlanStatus = (typeof QualityPlanStatus)[keyof typeof QualityPlanStatus]

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
  NonFunctional: 'NON_FUNCTIONAL',
  Integration: 'INTEGRATION',
  Regression: 'REGRESSION',
  Smoke: 'SMOKE',
  Performance: 'PERFORMANCE',
  Security: 'SECURITY',
  Usability: 'USABILITY',
  Exploratory: 'EXPLORATORY',
} as const
export type TestCaseType = (typeof TestCaseType)[keyof typeof TestCaseType]

export const TestCasePriority = {
  Critical: 'CRITICAL',
  High: 'HIGH',
  Medium: 'MEDIUM',
  Low: 'LOW',
} as const
export type TestCasePriority = (typeof TestCasePriority)[keyof typeof TestCasePriority]

export const TestCaseStatus = {
  Draft: 'DRAFT',
  Ready: 'READY',
  /** @deprecated Prefer Deprecated for simplified Case lifecycle; kept for BE compat */
  Approved: 'APPROVED',
  Deprecated: 'DEPRECATED',
  Archived: 'ARCHIVED',
} as const
export type TestCaseStatus = (typeof TestCaseStatus)[keyof typeof TestCaseStatus]

/** Unified Case lifecycle used by simplified Cases UI (maps APPROVED → Ready). */
export const CaseLifecycleStatus = {
  Draft: 'DRAFT',
  Ready: 'READY',
  Deprecated: 'DEPRECATED',
  Archived: 'ARCHIVED',
} as const
export type CaseLifecycleStatus = (typeof CaseLifecycleStatus)[keyof typeof CaseLifecycleStatus]

export const TestRunStatus = {
  Draft: 'DRAFT',
  Planned: 'PLANNED',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
} as const
export type TestRunStatus = (typeof TestRunStatus)[keyof typeof TestRunStatus]

export const ReleaseReadinessStatus = {
  Draft: 'DRAFT',
  AtRisk: 'AT_RISK',
  Blocked: 'BLOCKED',
  Ready: 'READY',
  Released: 'RELEASED',
  Cancelled: 'CANCELLED',
} as const
export type ReleaseReadinessStatus =
  (typeof ReleaseReadinessStatus)[keyof typeof ReleaseReadinessStatus]

/** Simplified Defect work-queue statuses (maps richer BE statuses). */
export const DefectWorkflowStatus = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Retest: 'RETEST',
  Closed: 'CLOSED',
  Rejected: 'REJECTED',
} as const
export type DefectWorkflowStatus =
  (typeof DefectWorkflowStatus)[keyof typeof DefectWorkflowStatus]

export const AutomationStatus = {
  Manual: 'MANUAL',
  Planned: 'PLANNED',
  Automated: 'AUTOMATED',
} as const
export type AutomationStatus = (typeof AutomationStatus)[keyof typeof AutomationStatus]

export const TestExecutionResult = {
  NotRun: 'NOT_RUN',
  Passed: 'PASSED',
  Failed: 'FAILED',
  Blocked: 'BLOCKED',
  Skipped: 'SKIPPED',
} as const
export type TestExecutionResult = (typeof TestExecutionResult)[keyof typeof TestExecutionResult]

export const TestRunType = {
  Manual: 'MANUAL',
  Automated: 'AUTOMATED',
  Regression: 'REGRESSION',
  Smoke: 'SMOKE',
} as const
export type TestRunType = (typeof TestRunType)[keyof typeof TestRunType]

export const RunScope = {
  Functional: 'FUNCTIONAL',
  NonFunctional: 'NON_FUNCTIONAL',
  Mixed: 'MIXED',
} as const
export type RunScope = (typeof RunScope)[keyof typeof RunScope]

export const VerificationMethod = {
  LoadTest: 'LOAD_TEST',
  PerformanceTest: 'PERFORMANCE_TEST',
  SecurityScan: 'SECURITY_SCAN',
  PenetrationTest: 'PENETRATION_TEST',
  AvailabilityCheck: 'AVAILABILITY_CHECK',
  AccessibilityAudit: 'ACCESSIBILITY_AUDIT',
  ComplianceReview: 'COMPLIANCE_REVIEW',
  ManualReview: 'MANUAL_REVIEW',
  MonitoringCheck: 'MONITORING_CHECK',
} as const
export type VerificationMethod = (typeof VerificationMethod)[keyof typeof VerificationMethod]

export const VerificationCaseStatus = {
  Draft: 'DRAFT',
  Ready: 'READY',
  Deprecated: 'DEPRECATED',
  Archived: 'ARCHIVED',
} as const
export type VerificationCaseStatus =
  (typeof VerificationCaseStatus)[keyof typeof VerificationCaseStatus]

export const QualityAttribute = {
  Performance: 'PERFORMANCE',
  Security: 'SECURITY',
  Availability: 'AVAILABILITY',
  Reliability: 'RELIABILITY',
  Scalability: 'SCALABILITY',
  Usability: 'USABILITY',
  Accessibility: 'ACCESSIBILITY',
  Compatibility: 'COMPATIBILITY',
  Maintainability: 'MAINTAINABILITY',
  Observability: 'OBSERVABILITY',
  DataIntegrity: 'DATA_INTEGRITY',
  Compliance: 'COMPLIANCE',
} as const
export type QualityAttribute = (typeof QualityAttribute)[keyof typeof QualityAttribute]

export const ComparisonOperator = {
  Lt: 'LT',
  Lte: 'LTE',
  Gt: 'GT',
  Gte: 'GTE',
  Eq: 'EQ',
  Between: 'BETWEEN',
} as const
export type ComparisonOperator = (typeof ComparisonOperator)[keyof typeof ComparisonOperator]

export const NfrTargetType = {
  System: 'SYSTEM',
  Module: 'MODULE',
  Function: 'FUNCTION',
  Api: 'API',
  Component: 'COMPONENT',
  Entity: 'ENTITY',
  Infrastructure: 'INFRASTRUCTURE',
} as const
export type NfrTargetType = (typeof NfrTargetType)[keyof typeof NfrTargetType]

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
export type DefectSeverity = (typeof DefectSeverity)[keyof typeof DefectSeverity]

export const DefectPriority = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
} as const
export type DefectPriority = (typeof DefectPriority)[keyof typeof DefectPriority]

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
