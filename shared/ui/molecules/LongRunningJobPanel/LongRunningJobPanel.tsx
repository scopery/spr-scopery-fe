import React from 'react'
import { mapJobStatusToUi } from '@/shared/lib/unifiedJob'
import { Button } from '../../atoms/Button'
import { LongRunningJobState, LongRunningJobStatus } from '../LongRunningJobState'
import type { LongRunningJobPanelProps } from './LongRunningJobPanel.types'

const UI_STATUS = {
  idle: LongRunningJobStatus.Idle,
  queued: LongRunningJobStatus.Queued,
  running: LongRunningJobStatus.Running,
  completed: LongRunningJobStatus.Completed,
  failed: LongRunningJobStatus.Failed,
  cancelled: LongRunningJobStatus.Cancelled,
} as const

/**
 * LongRunningJobPanel — Wave 4 wrapper around LongRunningJobState using UnifiedJob.
 */
export const LongRunningJobPanel = React.forwardRef<HTMLDivElement, LongRunningJobPanelProps>(
  ({ job, label, actions, className, onRetry, onCancel }, ref) => {
    if (!job) return null

    const uiStatus = UI_STATUS[mapJobStatusToUi(job.status)]
    const defaultActions =
      actions ??
      ((uiStatus === LongRunningJobStatus.Failed && onRetry) ||
      (uiStatus === LongRunningJobStatus.Running && onCancel) ||
      (uiStatus === LongRunningJobStatus.Queued && onCancel) ? (
        <div className="flex gap-sm">
          {uiStatus === LongRunningJobStatus.Failed && onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          {(uiStatus === LongRunningJobStatus.Running ||
            uiStatus === LongRunningJobStatus.Queued) &&
          onCancel ? (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      ) : undefined)

    return (
      <LongRunningJobState
        ref={ref}
        status={uiStatus}
        label={label ?? job.jobType}
        progress={job.progressPercent ?? null}
        message={job.errorMessage ?? (job.traceId ? `Trace: ${job.traceId}` : undefined)}
        actions={defaultActions}
        className={className}
      />
    )
  }
)

LongRunningJobPanel.displayName = 'LongRunningJobPanel'
