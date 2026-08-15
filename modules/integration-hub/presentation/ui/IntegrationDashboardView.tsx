'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  JobResultSummary,
  LongRunningJobPanel,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { useIntegrationDryRun } from '../hooks/useIntegrationDryRun'
import { useIntegrations } from '../hooks/useIntegrations'

export function IntegrationDashboardView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    dryRunJob,
    lastResult,
    dryRunComplete,
    busy,
    actionError: dryRunError,
    runDryRun,
    executeImport,
  } = useIntegrationDryRun(workspaceId)
  const {
    items,
    credentials,
    loading,
    error,
    actionError,
    actionResult,
    enable,
    disable,
    archive,
    healthCheck,
    test,
    pull,
    rotate,
    revoke,
  } = useIntegrations(workspaceId)

  const connections = items ?? []
  const credentialList = credentials ?? []

  if (loading && connections.length === 0 && credentialList.length === 0) {
    return <PageSkeleton variant="list" />
  }

  return (
    <Stack direction="vertical" spacing="md">
      <Typography as="h1" size="md" weight="medium">
        Integration Hub
      </Typography>
      <Typography tone="muted">
        Flow: validate → dry-run → execute → row-level results. Never execute without dry-run
        confirmation.
      </Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      {dryRunError ? <Typography tone="error">{dryRunError}</Typography> : null}
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {actionResult ? <Typography tone="muted">{actionResult}</Typography> : null}
      <div className="flex flex-wrap gap-sm">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || loading}
          onClick={() => void runDryRun()}
        >
          Run import dry-run
        </Button>
        <Button
          size="sm"
          disabled={busy || loading || !dryRunComplete}
          title={!dryRunComplete ? 'Complete a dry-run first' : undefined}
          onClick={() => void executeImport()}
        >
          Execute import
        </Button>
      </div>
      <LongRunningJobPanel job={dryRunJob} />
      {lastResult ? (
        <JobResultSummary
          total={lastResult.total}
          success={lastResult.success}
          failed={lastResult.failed}
        />
      ) : null}

      <Typography variant="h4">Connections</Typography>
      {connections.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No connections yet.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {connections.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {c.name}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[c.provider, c.status].filter(Boolean).join(' · ')}
                </Typography>
              </div>
              <div className="flex flex-wrap gap-xs">
                <Button size="sm" variant="outline" onClick={() => void enable(c.id)}>
                  Enable
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void disable(c.id)}>
                  Disable
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void healthCheck(c.id)}>
                  Health
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void test(c.id)}>
                  Test
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void pull(c.id)}>
                  Sync pull
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void archive(c.id)}>
                  Archive
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Credentials</Typography>
      {credentialList.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No credential references.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {credentialList.map((cred) => (
            <li key={cred.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {cred.name ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {cred.status}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void rotate(cred.id)}>
                  Rotate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void revoke(cred.id)}>
                  Revoke
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
