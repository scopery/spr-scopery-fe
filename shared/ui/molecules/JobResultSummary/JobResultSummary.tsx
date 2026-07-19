import React from 'react'
import { cn } from '@/utils/cn'
import { Typography } from '../../atoms/Typography'
import { Button } from '../../atoms/Button'
import { Stack } from '../../atoms/Stack'
import type { JobResultSummaryProps } from './JobResultSummary.types'

/**
 * JobResultSummary — total / success / warning / failed / skipped with retry actions.
 */
export function JobResultSummary({
  total,
  success,
  warning = 0,
  failed,
  skipped = 0,
  onRetryFailed,
  onDownloadErrors,
  className,
}: JobResultSummaryProps) {
  return (
    <Stack direction="vertical" spacing="sm" className={cn(className)}>
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-5">
        {[
          { label: 'Total', value: total, tone: 'default' as const },
          { label: 'Success', value: success, tone: 'success' as const },
          { label: 'Warning', value: warning, tone: 'warning' as const },
          { label: 'Failed', value: failed, tone: 'error' as const },
          { label: 'Skipped', value: skipped, tone: 'muted' as const },
        ].map((item) => (
          <div key={item.label} className="border border-neutral-200 bg-neutral-50 p-sm">
            <Typography variant="caption" tone="muted">
              {item.label}
            </Typography>
            <Typography variant="h4" tone={item.tone === 'default' ? undefined : item.tone}>
              {item.value}
            </Typography>
          </div>
        ))}
      </div>
      {(onRetryFailed || onDownloadErrors) && failed > 0 ? (
        <div className="flex flex-wrap gap-sm">
          {onRetryFailed ? (
            <Button size="sm" variant="outline" onClick={onRetryFailed}>
              Retry failed
            </Button>
          ) : null}
          {onDownloadErrors ? (
            <Button size="sm" variant="ghost" onClick={onDownloadErrors}>
              Download errors
            </Button>
          ) : null}
        </div>
      ) : null}
    </Stack>
  )
}

JobResultSummary.displayName = 'JobResultSummary'
