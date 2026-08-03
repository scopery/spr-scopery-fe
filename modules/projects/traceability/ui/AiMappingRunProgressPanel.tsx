'use client'

import { Badge, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  MappingRunStatus,
  mappingRunProgressPercent,
  type MappingRun,
} from '../model/mapping-suggestions'

interface AiMappingRunProgressPanelProps {
  run: MappingRun | null
  isPolling?: boolean
  className?: string
}

export function AiMappingRunProgressPanel({
  run,
  isPolling,
  className,
}: AiMappingRunProgressPanelProps) {
  if (!run) return null

  const total = run.sourceCount ?? 0
  const done = run.processedSourceCount ?? 0
  const suggestions = run.suggestionCount ?? 0
  const percent = mappingRunProgressPercent(run)
  const running = run.status === MappingRunStatus.Running || run.status === MappingRunStatus.Pending
  const failed = run.status === MappingRunStatus.Failed

  return (
    <section
      className={cn('border border-neutral-200 bg-white px-3 py-2.5', className)}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography size="sm" weight="medium">
          Mapping progress
        </Typography>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            size="sm"
            variant="soft"
            tone={failed ? 'error' : running ? 'warning' : 'success'}
          >
            {run.status}
          </Badge>
          {isPolling ? (
            <Badge size="sm" variant="soft" tone="neutral">
              Live
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden bg-neutral-100">
        <div
          className={cn(
            'h-full transition-[width] duration-300',
            failed ? 'bg-error' : running ? 'bg-primary' : 'bg-success'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
        <span className="tabular-nums">
          Sources {done}/{total || '—'} ({percent}%)
        </span>
        <span className="tabular-nums">Suggestions {suggestions}</span>
      </div>

      {running ? (
        <Typography variant="caption" tone="muted" className="mt-1.5 block">
          Running in the background — you can leave this tab; progress updates automatically.
        </Typography>
      ) : null}
      {failed ? (
        <Typography variant="caption" className="mt-1.5 block text-error">
          Mapping run failed. Try Generate again.
        </Typography>
      ) : null}
    </section>
  )
}
