export const ReportRunStatus = {
  Queued: 'QUEUED',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
} as const
export type ReportRunStatus = (typeof ReportRunStatus)[keyof typeof ReportRunStatus]
