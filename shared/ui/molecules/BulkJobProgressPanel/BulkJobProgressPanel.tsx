'use client'

import React, { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'
import {
  BulkJobStatus,
  buildFailedItemsImportPayload,
  bulkJobProgressPercent,
  formatBulkJobFailuresReport,
  getBulkJobFailures,
} from '@/shared/lib/bulkJobs'
import { Button } from '../../atoms/Button'
import { Progress } from '../../atoms/Progress'
import { Typography } from '../../atoms/Typography'
import type { BulkJobProgressPanelProps } from './BulkJobProgressPanel.types'

/**
 * Progress + result panel for async POST /bulk → poll bulk-jobs.
 * Shows live succeeded/failed counts and per-item failure table when BE returns `failures`.
 */
export const BulkJobProgressPanel = React.forwardRef<HTMLDivElement, BulkJobProgressPanelProps>(
  ({ job, percent, isPolling, error, className, onRetry, onRetryFailed }, ref) => {
    const [copiedItems, setCopiedItems] = useState(false)
    const [copiedReport, setCopiedReport] = useState(false)

    const failures = getBulkJobFailures(job)
    const failedItemsPayload = job ? buildFailedItemsImportPayload(job).items : []

    const copyText = useCallback(async (text: string, kind: 'items' | 'report') => {
      try {
        await navigator.clipboard.writeText(text)
        if (kind === 'items') {
          setCopiedItems(true)
          window.setTimeout(() => setCopiedItems(false), 2000)
          toast.success('Failed items JSON copied — paste into an agent or JSON Import')
        } else {
          setCopiedReport(true)
          window.setTimeout(() => setCopiedReport(false), 2000)
          toast.success('Failure report copied')
        }
      } catch {
        toast.error('Could not copy to clipboard')
      }
    }, [])

    if (!job && !error && !isPolling) return null

    const value = percent ?? (job ? bulkJobProgressPercent(job) : 0)
    const status = job?.status ?? (error ? BulkJobStatus.Failed : BulkJobStatus.Queued)
    const succeeded = job?.succeededItems ?? 0
    const failed = job?.failedItems ?? 0
    const processed = succeeded + failed
    const total = job?.totalItems ?? 0
    const terminal =
      status === BulkJobStatus.Failed || status === BulkJobStatus.Partial
    const showFailureActions = terminal && (failures.length > 0 || Boolean(onRetry))

    let message: string | null = error ?? null
    let tone: 'primary' | 'success' | 'warning' | 'error' = 'primary'

    if (!message && job) {
      switch (status) {
        case BulkJobStatus.Succeeded:
          tone = 'success'
          message =
            job.resultSummary ??
            `Created ${succeeded} item${succeeded === 1 ? '' : 's'}`
          break
        case BulkJobStatus.Partial:
          tone = 'warning'
          message =
            job.resultSummary ??
            `${succeeded} created successfully. ${failed} could not be created. Successful items are already saved — copy failed items, fix, and re-import.`
          break
        case BulkJobStatus.Failed:
          tone = 'error'
          message = job.errorMessage ?? job.resultSummary ?? 'All items failed'
          break
        case BulkJobStatus.Running:
        case BulkJobStatus.Queued:
          tone = 'primary'
          message =
            total > 0
              ? `Processing ${processed} of ${total}…`
              : status === BulkJobStatus.Queued
                ? 'Queued — waiting for worker…'
                : 'Running…'
          break
        default:
          message = status
      }
    }

    const showCounts = total > 0

    const handleRetry = () => {
      if (failedItemsPayload.length > 0 && onRetryFailed) {
        onRetryFailed(failedItemsPayload)
        return
      }
      onRetry?.()
    }

    return (
      <div
        ref={ref}
        className={cn('space-y-2 border border-neutral-200 bg-neutral-50 p-3', className)}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography variant="small" weight="medium">
            Bulk create
            {job?.jobType ? (
              <span className="ml-1 font-normal text-neutral-500">· {job.jobType}</span>
            ) : null}
          </Typography>
          <Typography variant="small" tone="muted">
            {value}%
            {showCounts ? ` · ${processed}/${total}` : ''}
          </Typography>
        </div>

        {showCounts ? (
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="text-success">{succeeded} succeeded</span>
            <span className={failed > 0 ? 'text-error' : 'text-neutral-500'}>
              {failed} failed
            </span>
            <span className="text-neutral-500">
              {Math.max(total - processed, 0)} remaining
            </span>
          </div>
        ) : null}

        <Progress
          value={value}
          tone={
            tone === 'success'
              ? 'success'
              : tone === 'warning'
                ? 'warning'
                : tone === 'error'
                  ? 'error'
                  : 'primary'
          }
          indeterminate={Boolean(isPolling && status === BulkJobStatus.Queued)}
        />
        {message ? (
          <Typography
            variant="small"
            tone={
              tone === 'success'
                ? 'success'
                : tone === 'warning'
                  ? 'warning'
                  : tone === 'error'
                    ? 'error'
                    : 'muted'
            }
          >
            {message}
          </Typography>
        ) : null}

        {failures.length > 0 ? (
          <div className="max-h-48 overflow-auto border border-neutral-200 bg-white">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Identity</th>
                  <th className="px-2 py-1.5 font-medium">Code</th>
                  <th className="px-2 py-1.5 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((f) => (
                  <tr key={`${f.index}-${f.identity ?? ''}`} className="border-t border-neutral-100">
                    <td className="px-2 py-1.5 font-mono text-neutral-500">{f.index}</td>
                    <td className="px-2 py-1.5 font-medium text-neutral-900">
                      {f.identity?.trim() || '—'}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-neutral-700">
                      {f.errorCode?.trim() || 'UNKNOWN'}
                    </td>
                    <td className="px-2 py-1.5 text-neutral-700">{f.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {showFailureActions ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {failedItemsPayload.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                icon={copiedItems ? <Check size={14} /> : <Copy size={14} />}
                onClick={() =>
                  void copyText(
                    JSON.stringify(buildFailedItemsImportPayload(job!), null, 2),
                    'items'
                  )
                }
              >
                {copiedItems ? 'Copied' : 'Copy failed items JSON'}
              </Button>
            ) : null}
            {failures.length > 0 || job?.errorMessage ? (
              <Button
                size="sm"
                variant="ghost"
                icon={copiedReport ? <Check size={14} /> : <Copy size={14} />}
                onClick={() => void copyText(formatBulkJobFailuresReport(job!), 'report')}
              >
                {copiedReport ? 'Copied' : 'Copy failure report'}
              </Button>
            ) : null}
            {onRetryFailed || onRetry ? (
              <Button size="sm" variant="secondary" onClick={handleRetry}>
                {failedItemsPayload.length > 0 ? 'Retry failed only' : 'Retry'}
              </Button>
            ) : null}
            <Typography variant="caption" tone="muted" className="basis-full sm:basis-auto">
              {failedItemsPayload.length > 0
                ? 'Copy JSON → fix with an agent → paste into JSON Import. Retry submits a new job with failed items only.'
                : 'Already-created items stay saved.'}
            </Typography>
          </div>
        ) : null}
      </div>
    )
  }
)

BulkJobProgressPanel.displayName = 'BulkJobProgressPanel'
