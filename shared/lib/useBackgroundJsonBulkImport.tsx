'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BulkJobProgressPanel, Modal, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  BulkJobStatus,
  bulkJobProgressPercent,
  type BulkJobResponse,
} from '@/shared/lib/bulkJobs'
import { useBulkJobPoller } from '@/shared/lib/useBulkJobPoller'

type MarkSubmitted = () => void

export type BackgroundJsonBulkImportOptions = {
  entityLabel: string
  onBatchComplete?: () => Promise<void> | void
}

/**
 * Shared JSON-import follow-up: one POST …/bulk, close paste modal immediately,
 * poll in the background, open a separate result modal on PARTIAL/FAILED.
 *
 * Important: do NOT call poller.reset() when the paste modal closes — that aborts the job follow-up.
 */
export function useBackgroundJsonBulkImport({
  entityLabel,
  onBatchComplete,
}: BackgroundJsonBulkImportOptions) {
  const poller = useBulkJobPoller()
  const [resultOpen, setResultOpen] = useState(false)
  const [resultJob, setResultJob] = useState<BulkJobResponse | null>(null)
  const retryAllRef = useRef<(() => Promise<void>) | null>(null)
  const retryFailedRef = useRef<((items: Record<string, unknown>[]) => Promise<void>) | null>(
    null
  )

  const followJob = useCallback(
    async (
      job: BulkJobResponse,
      afterSucceeded?: (done: BulkJobResponse) => Promise<void>
    ) => {
      try {
        const done = await poller.start(job.id, job)
        setResultJob(done)

        if (done.succeededItems > 0) {
          await afterSucceeded?.(done)
          await onBatchComplete?.()
        }

        if (done.status === BulkJobStatus.Succeeded) {
          toast.success(
            done.resultSummary ??
              `Created ${done.succeededItems} ${entityLabel}${done.succeededItems === 1 ? '' : 's'}`
          )
          return
        }

        setResultOpen(true)
        if (done.status === BulkJobStatus.Partial) {
          toast.warning(
            done.resultSummary ??
              `${done.succeededItems} created, ${done.failedItems} failed. Successful items are already saved.`
          )
        } else {
          toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk create failed')
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message =
          err instanceof ApiError
            ? err.problem.detail || err.message
            : err instanceof Error
              ? err.message
              : 'Import failed'
        toast.error(message)
        setResultOpen(true)
      }
    },
    [entityLabel, onBatchComplete, poller]
  )

  /**
   * Call after POST …/bulk returns 202. Marks paste submit done, toasts, starts
   * background poll, and returns immediately so JsonImportModal can close.
   */
  const acceptAndFollow = useCallback(
    (
      job: BulkJobResponse,
      markSubmitted: MarkSubmitted,
      afterSucceeded?: (done: BulkJobResponse) => Promise<void>
    ) => {
      markSubmitted()
      toast.message('Job accepted', { description: 'Processing in the background…' })
      void followJob(job, afterSucceeded)
    },
    [followJob]
  )

  const setRetryHandlers = useCallback(
    (handlers: {
      retryAll?: () => Promise<void>
      retryFailed?: (items: Record<string, unknown>[]) => Promise<void>
    }) => {
      retryAllRef.current = handlers.retryAll ?? null
      retryFailedRef.current = handlers.retryFailed ?? null
    },
    []
  )

  const resultModal = (
    <Modal
      open={resultOpen}
      onClose={() => setResultOpen(false)}
      title={`${entityLabel} import results`}
      size="lg"
      actions={[
        {
          label: 'Close',
          variant: 'ghost',
          onClick: () => setResultOpen(false),
        },
        ...(resultJob?.failures?.length
          ? [
              {
                label: 'Retry failed',
                variant: 'primary' as const,
                onClick: () => {
                  const failures = resultJob.failures ?? []
                  const items = failures
                    .map((f) => f.item)
                    .filter(
                      (item): item is Record<string, unknown> =>
                        Boolean(item) && typeof item === 'object'
                    )
                  setResultOpen(false)
                  void retryFailedRef.current?.(items)
                },
              },
            ]
          : []),
      ]}
    >
      <div className="space-y-md">
        <Typography variant="small" tone="muted">
          Import finished with errors. Successful rows are already saved — only failures need
          attention.
        </Typography>
        <BulkJobProgressPanel
          job={resultJob ?? poller.job}
          percent={resultJob ? bulkJobProgressPercent(resultJob) : poller.percent}
          isPolling={false}
          error={poller.error}
          onRetryFailed={(failedItems) => {
            setResultOpen(false)
            void retryFailedRef.current?.(failedItems)
          }}
          onRetry={() => {
            setResultOpen(false)
            void retryAllRef.current?.()
          }}
        />
      </div>
    </Modal>
  )

  return {
    acceptAndFollow,
    setRetryHandlers,
    resultModal,
    /** Expose for rare cases that still need live progress while paste stays open. */
    poller,
  }
}
