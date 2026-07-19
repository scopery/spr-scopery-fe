/**
 * Unified long-running job contract helpers (Wave 4 §22.1).
 */

export const UnifiedJobStatus = {
  Queued: 'QUEUED',
  Pending: 'PENDING',
  Running: 'RUNNING',
  Processing: 'PROCESSING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const

export type UnifiedJobStatus = (typeof UnifiedJobStatus)[keyof typeof UnifiedJobStatus]

export interface UnifiedJob {
  jobId: string
  jobType: string
  status: UnifiedJobStatus | string
  progressPercent?: number | null
  processedCount?: number | null
  successCount?: number | null
  warningCount?: number | null
  failureCount?: number | null
  startedAt?: string | null
  completedAt?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  traceId?: string | null
}

export function isJobBusy(status: string): boolean {
  const s = status.toUpperCase()
  return (
    s === UnifiedJobStatus.Queued ||
    s === UnifiedJobStatus.Pending ||
    s === UnifiedJobStatus.Running ||
    s === UnifiedJobStatus.Processing
  )
}

export function isJobTerminal(status: string): boolean {
  const s = status.toUpperCase()
  return (
    s === UnifiedJobStatus.Completed ||
    s === UnifiedJobStatus.Failed ||
    s === UnifiedJobStatus.Cancelled
  )
}

/** Map BE job status → LongRunningJobState UI status. */
export function mapJobStatusToUi(
  status: string
): 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' {
  switch (status.toUpperCase()) {
    case 'QUEUED':
    case 'PENDING':
      return 'queued'
    case 'RUNNING':
    case 'PROCESSING':
      return 'running'
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'idle'
  }
}
