export const ScheduleRunStatus = {
  Pending: 'PENDING',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const
export type ScheduleRunStatus = (typeof ScheduleRunStatus)[keyof typeof ScheduleRunStatus]
