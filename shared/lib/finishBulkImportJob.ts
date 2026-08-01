import { toast } from 'sonner'
import { BulkJobStatus, type BulkJobResponse } from './bulkJobs'

export type BulkImportFinishResult = void | 'keep-open'

/**
 * Terminal handling for JSON/bulk import after poll completes.
 * SUCCEEDED → toast + close; PARTIAL/FAILED → toast + keep modal open for review/retry.
 */
export function finishBulkImportJob(
  done: BulkJobResponse,
  entityLabel = 'item'
): BulkImportFinishResult {
  if (done.status === BulkJobStatus.Succeeded) {
    toast.success(
      done.resultSummary ??
        `Created ${done.succeededItems} ${entityLabel}${done.succeededItems === 1 ? '' : 's'}`
    )
    return
  }

  if (done.status === BulkJobStatus.Partial) {
    toast.warning(
      done.resultSummary ??
        `${done.succeededItems} created, ${done.failedItems} failed. Successful items are already saved.`
    )
    return 'keep-open'
  }

  toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk create failed')
  return 'keep-open'
}
