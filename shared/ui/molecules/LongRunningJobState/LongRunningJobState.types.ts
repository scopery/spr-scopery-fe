import type { ReactNode } from 'react'

export const LongRunningJobStatus = {
  Idle: 'idle',
  Queued: 'queued',
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const

export type LongRunningJobStatus =
  (typeof LongRunningJobStatus)[keyof typeof LongRunningJobStatus]

export interface LongRunningJobStateProps {
  status: LongRunningJobStatus
  /** Short label shown next to status (e.g. "Recalculating finance"). */
  label?: string
  /** Optional progress 0–100 when running. */
  progress?: number | null
  /** Error or detail message for failed / completed with notes. */
  message?: string
  /** Optional action slot (Cancel, Retry, View result). */
  actions?: ReactNode
  className?: string
}
