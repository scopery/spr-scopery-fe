export const EstimationRunStatus = {
  Pending: 'PENDING',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const
export type EstimationRunStatus =
  (typeof EstimationRunStatus)[keyof typeof EstimationRunStatus]

export const EstimationCalculationMode = {
  Standard: 'STANDARD',
  Blended: 'BLENDED',
  RoleBased: 'ROLE_BASED',
} as const
export type EstimationCalculationMode =
  (typeof EstimationCalculationMode)[keyof typeof EstimationCalculationMode]

export const RateTargetDateStrategy = {
  TaskStartDate: 'TASK_START_DATE',
  ProjectStartDate: 'PROJECT_START_DATE',
  RunDate: 'RUN_DATE',
  FixedDate: 'FIXED_DATE',
} as const
export type RateTargetDateStrategy =
  (typeof RateTargetDateStrategy)[keyof typeof RateTargetDateStrategy]

export const TaskEstimateStatus = {
  Resolved: 'RESOLVED',
  UnresolvedRole: 'UNRESOLVED_ROLE',
  UnresolvedRate: 'UNRESOLVED_RATE',
  Excluded: 'EXCLUDED',
} as const
export type TaskEstimateStatus =
  (typeof TaskEstimateStatus)[keyof typeof TaskEstimateStatus]
