import { toast } from 'sonner'
import type { BulkJobResponse } from './bulkJobs'
import type { UseBulkJobPollerResult } from './useBulkJobPoller'

/**
 * After POST …/bulk returns 202: acknowledge immediately, then poll with seed job
 * so progress UI paints QUEUED without a blocking spinner.
 */
export async function acceptBulkJobAndPoll(
  poller: Pick<UseBulkJobPollerResult, 'start'>,
  job: BulkJobResponse,
  options?: { toastAccepted?: boolean }
): Promise<BulkJobResponse> {
  if (options?.toastAccepted !== false) {
    toast.message('Job accepted', { description: 'Processing in the background…' })
  }
  return poller.start(job.id, job)
}
