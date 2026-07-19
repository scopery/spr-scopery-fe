export const ExecutionRunStatus = {
  Succeeded: 'SUCCEEDED',
  Failed: 'FAILED',
  Pending: 'PENDING',
} as const
export type ExecutionRunStatus =
  (typeof ExecutionRunStatus)[keyof typeof ExecutionRunStatus]

export const ExecutionTriggerSource = {
  Event: 'EVENT',
  Manual: 'MANUAL',
  Api: 'API',
  Playground: 'PLAYGROUND',
  Scheduled: 'SCHEDULED',
} as const
export type ExecutionTriggerSource =
  (typeof ExecutionTriggerSource)[keyof typeof ExecutionTriggerSource]

export const ExecutionLogStatus = {
  Pending: 'PENDING',
  Running: 'RUNNING',
  Succeeded: 'SUCCEEDED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const
export type ExecutionLogStatus =
  (typeof ExecutionLogStatus)[keyof typeof ExecutionLogStatus]

export const EXECUTION_TRIGGER_SOURCE_OPTIONS = [
  { value: ExecutionTriggerSource.Event, label: 'Event' },
  { value: ExecutionTriggerSource.Manual, label: 'Manual' },
  { value: ExecutionTriggerSource.Api, label: 'API' },
  { value: ExecutionTriggerSource.Playground, label: 'Playground' },
  { value: ExecutionTriggerSource.Scheduled, label: 'Scheduled' },
]

export const EXECUTION_LOG_STATUS_OPTIONS = [
  { value: ExecutionLogStatus.Pending, label: 'Pending' },
  { value: ExecutionLogStatus.Running, label: 'Running' },
  { value: ExecutionLogStatus.Succeeded, label: 'Succeeded' },
  { value: ExecutionLogStatus.Failed, label: 'Failed' },
  { value: ExecutionLogStatus.Cancelled, label: 'Cancelled' },
]
