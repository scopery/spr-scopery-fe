import type { BulkJobResponse } from '@/shared/lib/bulkJobs'

export interface BulkJobProgressPanelProps {
  job: BulkJobResponse | null
  percent?: number
  isPolling?: boolean
  error?: string | null
  className?: string
  /**
   * Retry with only failed item payloads from `job.failures`.
   * Prefer this when BE returns per-item failures.
   */
  onRetryFailed?: (failedItems: Record<string, unknown>[]) => void
  /** Fallback retry when there are no per-item failures (system-level FAILED). */
  onRetry?: () => void
}
