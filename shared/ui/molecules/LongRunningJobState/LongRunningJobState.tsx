import React from 'react'
import { cn } from '@/utils/cn'
import { Progress } from '../../atoms/Progress'
import { Spinner } from '../../atoms/Spinner'
import { Typography } from '../../atoms/Typography'
import {
  LongRunningJobStatus,
  type LongRunningJobStateProps,
} from './LongRunningJobState.types'

const STATUS_LABEL: Record<LongRunningJobStatus, string> = {
  [LongRunningJobStatus.Idle]: 'Idle',
  [LongRunningJobStatus.Queued]: 'Queued',
  [LongRunningJobStatus.Running]: 'Running',
  [LongRunningJobStatus.Completed]: 'Completed',
  [LongRunningJobStatus.Failed]: 'Failed',
  [LongRunningJobStatus.Cancelled]: 'Cancelled',
}

const STATUS_TONE: Record<
  LongRunningJobStatus,
  'muted' | 'info' | 'primary' | 'success' | 'error' | 'warning'
> = {
  [LongRunningJobStatus.Idle]: 'muted',
  [LongRunningJobStatus.Queued]: 'info',
  [LongRunningJobStatus.Running]: 'primary',
  [LongRunningJobStatus.Completed]: 'success',
  [LongRunningJobStatus.Failed]: 'error',
  [LongRunningJobStatus.Cancelled]: 'warning',
}

/**
 * LongRunningJobState — idle/queued/running/completed/failed/cancelled UX
 * for rebuild, recalculate, estimation, baseline refresh, etc.
 */
export const LongRunningJobState = React.forwardRef<HTMLDivElement, LongRunningJobStateProps>(
  ({ status, label, progress, message, actions, className }, ref) => {
    if (status === LongRunningJobStatus.Idle && !label && !message && !actions) {
      return null
    }

    const busy =
      status === LongRunningJobStatus.Queued || status === LongRunningJobStatus.Running
    const showBar =
      status === LongRunningJobStatus.Running && progress != null && !Number.isNaN(progress)

    return (
      <div
        ref={ref}
        role="status"
        aria-live={busy ? 'polite' : 'off'}
        aria-busy={busy}
        className={cn(
          'flex flex-col gap-sm border border-neutral-200 bg-neutral-50 px-md py-sm',
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-sm">
          {busy ? <Spinner size="sm" tone="primary" aria-hidden /> : null}
          <Typography as="span" variant="small" weight="medium" tone={STATUS_TONE[status]}>
            {label ?? STATUS_LABEL[status]}
          </Typography>
          {label ? (
            <Typography as="span" variant="caption" tone="muted">
              {STATUS_LABEL[status]}
            </Typography>
          ) : null}
        </div>

        {showBar ? <Progress value={progress ?? 0} size="sm" tone="primary" /> : null}

        {status === LongRunningJobStatus.Running && progress == null ? (
          <Progress indeterminate size="sm" tone="primary" />
        ) : null}

        {message ? (
          <Typography variant="caption" tone={status === LongRunningJobStatus.Failed ? 'error' : 'muted'}>
            {message}
          </Typography>
        ) : null}

        {actions ? <div className="flex flex-wrap gap-sm">{actions}</div> : null}
      </div>
    )
  }
)

LongRunningJobState.displayName = 'LongRunningJobState'
