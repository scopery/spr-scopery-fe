export const MyInsightsDateRange = {
  Days7: '7d',
  Days30: '30d',
  Days90: '90d',
  ThisYear: 'this_year',
  Custom: 'custom',
} as const
export type MyInsightsDateRange = (typeof MyInsightsDateRange)[keyof typeof MyInsightsDateRange]

export const MyInsightsAttentionKind = {
  Overdue: 'overdue',
  Unscheduled: 'unscheduled',
  Blocked: 'blocked',
  MissingEstimate: 'missing_estimate',
  NoDueDate: 'no_due_date',
  DependencyConflict: 'dependency_conflict',
} as const
export type MyInsightsAttentionKind =
  (typeof MyInsightsAttentionKind)[keyof typeof MyInsightsAttentionKind]

export const MyInsightsWorkChip = {
  AllOpen: 'all_open',
  NotStarted: 'not_started',
  DueThisWeek: 'due_this_week',
  Unscheduled: 'unscheduled',
  Blocked: 'blocked',
  Overdue: 'overdue',
} as const
export type MyInsightsWorkChip = (typeof MyInsightsWorkChip)[keyof typeof MyInsightsWorkChip]

export const MyInsightsHealthStatus = {
  OnTrack: 'ON_TRACK',
  NeedsAttention: 'NEEDS_ATTENTION',
  Overloaded: 'OVERLOADED',
  InsufficientData: 'INSUFFICIENT_DATA',
} as const
export type MyInsightsHealthStatus =
  (typeof MyInsightsHealthStatus)[keyof typeof MyInsightsHealthStatus]

export const MyInsightsWorkloadState = {
  Normal: 'NORMAL',
  NearCapacity: 'NEAR_CAPACITY',
  Overloaded: 'OVERLOADED',
  NoCapacity: 'NO_CAPACITY',
} as const
export type MyInsightsWorkloadState =
  (typeof MyInsightsWorkloadState)[keyof typeof MyInsightsWorkloadState]

export const HeatmapMetric = {
  CompletedEffort: 'completed_effort',
  CompletedTasks: 'completed_tasks',
  ActiveDays: 'active_days',
  PlannedEffort: 'planned_effort',
  OverdueResolved: 'overdue_resolved',
} as const
export type HeatmapMetric = (typeof HeatmapMetric)[keyof typeof HeatmapMetric]
