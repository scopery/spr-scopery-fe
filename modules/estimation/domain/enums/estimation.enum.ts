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
  TaskEstimateOnly: 'TASK_ESTIMATE_ONLY',
  TaskEstimateWithRate: 'TASK_ESTIMATE_WITH_RATE',
  ScheduledWorkWithRate: 'SCHEDULED_WORK_WITH_RATE',
} as const
export type EstimationCalculationMode =
  (typeof EstimationCalculationMode)[keyof typeof EstimationCalculationMode]

export const RateTargetDateStrategy = {
  ProjectPlannedStart: 'PROJECT_PLANNED_START',
  TaskDueDate: 'TASK_DUE_DATE',
  TaskScheduledStart: 'TASK_SCHEDULED_START',
  TaskScheduledFinish: 'TASK_SCHEDULED_FINISH',
  RunDate: 'RUN_DATE',
  CustomDate: 'CUSTOM_DATE',
  TaskDueDateOrProjectStart: 'TASK_DUE_DATE_OR_PROJECT_START',
} as const
export type RateTargetDateStrategy =
  (typeof RateTargetDateStrategy)[keyof typeof RateTargetDateStrategy]

export const TaskEstimateStatus = {
  Calculated: 'CALCULATED',
  RoleUnresolved: 'ROLE_UNRESOLVED',
  RateUnresolved: 'RATE_UNRESOLVED',
  Unestimated: 'TASK_UNESTIMATED',
  Excluded: 'EXCLUDED',
} as const
export type TaskEstimateStatus =
  (typeof TaskEstimateStatus)[keyof typeof TaskEstimateStatus]
