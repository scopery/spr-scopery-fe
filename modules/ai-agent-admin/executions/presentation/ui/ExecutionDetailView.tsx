'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { useExecutionLogDetail } from '../hooks/useExecutionLogs'
import { useCanViewExecutionLogs } from '../hooks/useExecutionPermissions'

export function ExecutionDetailView() {
  const { executionLogId } = useParams<{ executionLogId: string }>()
  const canView = useCanViewExecutionLogs()
  const { log, loading, error } = useExecutionLogDetail(executionLogId)

  if (!canView) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">You do not have permission to view execution logs.</Typography>
      </Stack>
    )
  }

  if (loading && !log) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !log) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Execution log not found'}</Typography>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.aiControlExecutions}
          size="sm"
          variant="outline"
        >
          Back to executions
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button
            as={NextLink}
            href={ADMIN_ROUTES.aiControlExecutions}
            size="sm"
            variant="ghost"
          >
            ← Executions
          </Button>
          <Typography variant="h2" className="mt-sm">
            Execution detail
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {log.requestId}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          <AiLifecycleStatusBadge status={log.status} />
          {log.eventConfigId ? (
            <Button
              as={NextLink}
              href={ADMIN_ROUTES.aiControlEventConfig(log.eventConfigId)}
              size="sm"
              variant="outline"
            >
              Related config
            </Button>
          ) : null}
        </div>
      </div>

      <Typography variant="caption" tone="muted">
        Cancel / status transitions are service-orchestrated. This UI is read-only for log
        lifecycle.
      </Typography>

      <dl className="grid gap-md sm:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted">
            Trigger
          </Typography>
          <Typography className="mt-1">{log.triggerSource || '—'}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Created
          </Typography>
          <Typography className="mt-1">
            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Event config / definition
          </Typography>
          <Typography className="mt-1 font-mono text-xs">
            {log.eventConfigId || '—'} / {log.eventDefinitionId || '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Agent / prompt / deployment
          </Typography>
          <Typography className="mt-1 font-mono text-xs">
            {log.agentId || '—'} / {log.promptVersionId || '—'} /{' '}
            {log.modelDeploymentId || '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Tokens (in / out / total)
          </Typography>
          <Typography className="mt-1">
            {log.inputTokenCount ?? '—'} / {log.outputTokenCount ?? '—'} /{' '}
            {log.totalTokenCount ?? '—'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted">
            Cost / duration
          </Typography>
          <Typography className="mt-1">
            {log.estimatedCost ?? '—'} /{' '}
            {log.durationMs != null ? `${log.durationMs}ms` : '—'}
          </Typography>
        </div>
      </dl>

      <div>
        <Typography variant="h3" className="mb-sm">
          Input variables
        </Typography>
        <pre className="overflow-x-auto border border-neutral-200 bg-neutral-50 p-md font-mono text-xs">
          {log.inputVariables
            ? JSON.stringify(log.inputVariables, null, 2)
            : '—'}
        </pre>
      </div>

      <div>
        <Typography variant="h3" className="mb-sm">
          Output
        </Typography>
        <pre className="overflow-x-auto border border-neutral-200 bg-neutral-50 p-md font-mono text-xs whitespace-pre-wrap">
          {log.output || '—'}
        </pre>
      </div>

      {(log.errorCode || log.errorMessage) && (
        <div>
          <Typography variant="h3" className="mb-sm">
            Error
          </Typography>
          <Typography tone="error" variant="small">
            {log.errorCode ? `[${log.errorCode}] ` : ''}
            {log.errorMessage || '—'}
          </Typography>
        </div>
      )}
    </Stack>
  )
}
