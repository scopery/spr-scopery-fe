export const TimelineGranularity = {
  Day: 'DAY',
  Week: 'WEEK',
  Month: 'MONTH',
  Quarter: 'QUARTER',
} as const
export type TimelineGranularity = (typeof TimelineGranularity)[keyof typeof TimelineGranularity]

export const TimelineMetric = {
  Schedule: 'SCHEDULE',
  Effort: 'EFFORT',
  PlannedPercent: 'PLANNED_PERCENT',
  ActualPercent: 'ACTUAL_PERCENT',
  Variance: 'VARIANCE',
  Occupancy: 'OCCUPANCY',
} as const
export type TimelineMetric = (typeof TimelineMetric)[keyof typeof TimelineMetric]

export const TimelineMode = {
  Timeline: 'TIMELINE',
  Planning: 'PLANNING',
} as const
export type TimelineMode = (typeof TimelineMode)[keyof typeof TimelineMode]

export const AllocationSource = {
  Auto: 'AUTO',
  Manual: 'MANUAL',
} as const
export type AllocationSource = (typeof AllocationSource)[keyof typeof AllocationSource]

/** Default member working capacity used for Occupancy until capacity calendars are wired. */
export const DEFAULT_DAY_CAPACITY_MINUTES = 8 * 60
