'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Badge, Button, PageSkeleton, Select, Spinner, Stack, Typography } from '@/shared/ui'
import { useAiPlanning } from '../hooks/useAiPlanning'

const RUN_TYPE_OPTIONS = [
  { value: 'PROJECT_PLAN_DRAFT', label: 'Project Plan Draft' },
  { value: 'TASK_ESTIMATE_SUGGESTION', label: 'Task Estimate Suggestion' },
  { value: 'COST_ROLE_SUGGESTION', label: 'Cost Role Suggestion' },
  { value: 'GENERAL_PROJECT_ASSISTANT', label: 'General Assistant' },
]

function formatRunType(runType: string): string {
  return RUN_TYPE_OPTIONS.find((o) => o.value === runType)?.label ?? runType
}

function RunStatusBadge({ status }: { status: string }) {
  if (status === 'RUNNING') {
    return (
      <span className="flex items-center gap-xs">
        <Spinner size="xs" />
        <Typography variant="caption" tone="muted">Running…</Typography>
      </span>
    )
  }
  if (status === 'COMPLETED') return <Badge tone="success" size="sm">Completed</Badge>
  if (status === 'FAILED') return <Badge tone="error" size="sm">Failed</Badge>
  if (status === 'CANCELLED') return <Badge tone="neutral" size="sm">Cancelled</Badge>
  return <Badge tone="neutral" size="sm">{status}</Badge>
}

export function AiPlanningCenterView() {
  const { projectId, workspaceId } = useParams<{ projectId: string; workspaceId: string }>()
  const { items, loading, creating, error, create } = useAiPlanning(projectId)

  const [selectedRunType, setSelectedRunType] = useState('PROJECT_PLAN_DRAFT')
  const [showNewRun, setShowNewRun] = useState(false)

  if (loading && items.length === 0) return <PageSkeleton variant="list" className="px-3 py-3 lg:px-4" />

  const sortedRuns = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4">
      <div className="flex items-center justify-between gap-md">
        <div>
          <Typography as="h1" size="md" weight="medium">AI Planning History</Typography>
          <Typography variant="small" tone="muted">
            Each run analyses the project and generates suggestions. Review and apply them below.
          </Typography>
        </div>
        <Button size="sm" onClick={() => setShowNewRun((v) => !v)} disabled={creating}>
          {creating ? <><Spinner size="xs" className="mr-xs" />Running…</> : 'New Run'}
        </Button>
      </div>

      {showNewRun && !creating ? (
        <div className="flex flex-wrap items-end gap-sm border border-neutral-200 bg-neutral-50 p-md">
          <div className="min-w-[220px]">
            <Typography variant="caption" tone="muted" className="mb-1 block">Run type</Typography>
            <Select
              value={selectedRunType}
              onValueChange={setSelectedRunType}
              options={RUN_TYPE_OPTIONS}
              size="sm"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              void create(selectedRunType).then(() => setShowNewRun(false))
            }}
          >
            Start
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNewRun(false)}>
            Cancel
          </Button>
        </div>
      ) : null}

      {error ? <Typography tone="error">{error}</Typography> : null}

      {sortedRuns.length === 0 ? (
        <Typography tone="muted">No planning runs yet. Click "New Run" to start.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {sortedRuns.map((run, idx) => {
            const runNumber = sortedRuns.length - idx
            const href = `/workspace/${workspaceId}/projects/${projectId}/ai-planning/${run.id}`
            return (
              <li key={run.id}>
                <NextLink
                  href={href}
                  className="flex items-center justify-between gap-md p-md hover:bg-neutral-50"
                >
                  <div>
                    <div className="flex items-center gap-sm">
                      <Typography variant="small" weight="medium">
                        Run #{runNumber}
                      </Typography>
                      <Typography variant="caption" tone="muted">
                        {formatRunType(run.runType)}
                      </Typography>
                    </div>
                    <Typography variant="caption" tone="muted">
                      {run.startedAt
                        ? new Date(run.startedAt).toLocaleString()
                        : new Date(run.createdAt).toLocaleString()}
                      {run.completedAt
                        ? ` → ${new Date(run.completedAt).toLocaleTimeString()}`
                        : ''}
                    </Typography>
                    {run.errorMessage ? (
                      <Typography variant="caption" tone="error">{run.errorMessage}</Typography>
                    ) : null}
                  </div>
                  <RunStatusBadge status={run.status} />
                </NextLink>
              </li>
            )
          })}
        </ul>
      )}
    </Stack>
  )
}
