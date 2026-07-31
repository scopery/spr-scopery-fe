'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CurrencyAmount,
  DataTable,
  FinancialKpiStrip,
  LongRunningJobState,
  LongRunningJobStatus,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import * as scheduleApi from '@/modules/projects/schedule/infrastructure/api/schedule.api'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useEstimationCenter } from '../hooks/useEstimationCenter'
import { CreateEstimationRunModal } from './CreateEstimationRunModal'
import {
  calculationModeLabel,
  canCancelEstimation,
  canMarkCurrent,
  estimationStatusLabel,
  estimationStatusTone,
  formatHours,
  isEstimationRunning,
  rateStrategyLabel,
} from '../../domain/rules/estimation.rules'
import { EstimationRunStatus } from '../../domain/enums/estimation.enum'
import type { EstimationRun } from '../../domain/model/estimation'

function toJobStatus(status: string): LongRunningJobStatus {
  switch (status) {
    case EstimationRunStatus.Pending:
      return LongRunningJobStatus.Queued
    case EstimationRunStatus.Running:
      return LongRunningJobStatus.Running
    case EstimationRunStatus.Completed:
      return LongRunningJobStatus.Completed
    case EstimationRunStatus.Failed:
      return LongRunningJobStatus.Failed
    case EstimationRunStatus.Cancelled:
      return LongRunningJobStatus.Cancelled
    default:
      return LongRunningJobStatus.Idle
  }
}

function formatInstant(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function EstimationCenterView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)
  const [scheduleOptions, setScheduleOptions] = useState<Array<{ id: string; label: string }>>([])

  const { project } = useProject(workspaceId, projectId)
  const {
    runs,
    currentRun,
    currentSummary,
    loading,
    creating,
    error,
    forbidden,
    createRun,
    cancelRun,
    markCurrent,
  } = useEstimationCenter(projectId)

  useEffect(() => {
    if (!projectId) return
    void scheduleApi
      .listScheduleRuns(projectId)
      .then((list) => {
        setScheduleOptions(
          (list ?? []).map((r) => ({
            id: r.id,
            label: `${r.status}${r.planningStartDate ? ` · ${r.planningStartDate}` : ''} → ${r.planningEndDate ?? '—'}`,
          }))
        )
      })
      .catch(() => setScheduleOptions([]))
  }, [projectId])

  const running = runs.find(isEstimationRunning)

  const handleCancel = async (run: EstimationRun) => {
    try {
      await cancelRun(run.id)
      toast.success('Estimation run cancelled')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleMarkCurrent = async (run: EstimationRun) => {
    const ok = window.confirm(
      currentRun
        ? `Mark “${run.name}” as current? Current estimate will switch from “${currentRun.name}”.`
        : `Mark “${run.name}” as the current estimate?`
    )
    if (!ok) return
    try {
      await markCurrent(run.id)
      toast.success('Current estimate updated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && runs.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to estimation</Typography>
      </Card>
    )
  }

  const currency = currentSummary?.currencyCode ?? 'USD'
  const kpiItems = currentSummary
    ? [
        {
          id: 'hours',
          label: 'Estimate hours',
          value: (
            <Typography weight="semibold">
              {formatHours(currentSummary.totalEstimateHours)}
            </Typography>
          ),
        },
        {
          id: 'labor',
          label: 'Labor cost',
          value: <CurrencyAmount amount={currentSummary.totalLaborCost} currency={currency} />,
        },
        {
          id: 'billing',
          label: 'Billing preview',
          value: <CurrencyAmount amount={currentSummary.totalBillingPreview} currency={currency} />,
        },
        {
          id: 'included',
          label: 'Included / excluded',
          value: (
            <Typography weight="semibold">
              {currentSummary.includedTaskCount} / {currentSummary.excludedTaskCount}
            </Typography>
          ),
        },
        {
          id: 'warnings',
          label: 'Warnings',
          value: <Typography weight="semibold">{currentSummary.warningCount}</Typography>,
        },
      ]
    : []

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Estimation"
      />

      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Estimation Center
          </Typography>
          {project ? (
            <Typography variant="caption" tone="muted" className="mt-0.5">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          loading={creating}
          onClick={() => setCreateOpen(true)}
        >
          New estimation run
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {running ? (
        <LongRunningJobState
          className="mb-4"
          status={toJobStatus(running.status)}
          label={running.name}
          message={
            running.status === EstimationRunStatus.Pending
              ? 'Queued — waiting to start'
              : 'Calculating task estimates…'
          }
          actions={
            canCancelEstimation(running) ? (
              <Button size="sm" variant="ghost" onClick={() => void handleCancel(running)}>
                Cancel
              </Button>
            ) : null
          }
        />
      ) : null}

      <Typography as="h2" size="md" weight="semibold" className="mb-2">
        Current estimate
      </Typography>
      {currentSummary && currentRun ? (
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-sm">
            <Typography variant="small" weight="medium">
              {currentRun.name}
            </Typography>
            <Badge tone="success" size="sm">
              Current
            </Badge>
            <NextLink
              href={ROUTES.workspace.projectEstimationRun(workspaceId, projectId, currentRun.id)}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Open detail
            </NextLink>
          </div>
          <FinancialKpiStrip items={kpiItems} mode="compact" />
          <div className="mt-3 flex flex-wrap gap-sm">
            <Badge size="sm" tone="neutral">
              Unestimated: {currentSummary.unestimatedTaskCount}
            </Badge>
            <Badge size="sm" tone="warning">
              Unresolved role: {currentSummary.unresolvedRoleTaskCount}
            </Badge>
            <Badge size="sm" tone="warning">
              Unresolved rate: {currentSummary.unresolvedRateTaskCount}
            </Badge>
          </div>
        </div>
      ) : (
        <Card className="mb-8 border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            No current estimate yet. Create a run and mark it as current.
          </Typography>
        </Card>
      )}

      <Typography as="h2" size="md" weight="semibold" className="mb-2">
        Estimation runs
      </Typography>
      <DataTable<EstimationRun>
        ariaLabel="Estimation runs"
        rows={runs}
        rowKey={(run) => run.id}
        emptyMessage="No estimation runs yet"
        columns={[
          {
            id: 'name',
            header: 'Name',
            cell: (run) => (
              <>
                <NextLink
                  href={ROUTES.workspace.projectEstimationRun(workspaceId, projectId, run.id)}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {run.name}
                </NextLink>
                {run.errorMessage ? (
                  <Typography variant="caption" tone="error" className="mt-0.5 block">
                    {run.errorCode ? `${run.errorCode}: ` : ''}
                    {run.errorMessage}
                  </Typography>
                ) : null}
              </>
            ),
          },
          {
            id: 'mode',
            header: 'Mode',
            accessor: (run) => calculationModeLabel(run.calculationMode),
          },
          {
            id: 'strategy',
            header: 'Rate strategy',
            accessor: (run) => rateStrategyLabel(run.rateTargetDateStrategy),
          },
          { id: 'currency', header: 'Currency', accessor: 'currencyPolicy' },
          {
            id: 'status',
            header: 'Status',
            cell: (run) => (
              <Badge tone={estimationStatusTone(run.status)}>
                {estimationStatusLabel(run.status)}
              </Badge>
            ),
          },
          {
            id: 'current',
            header: 'Current',
            cell: (run) =>
              currentRun?.id === run.id ? (
                <Badge tone="success" size="sm">
                  Yes
                </Badge>
              ) : (
                '—'
              ),
          },
          { id: 'started', header: 'Started', accessor: (run) => formatInstant(run.startedAt) },
          {
            id: 'completed',
            header: 'Completed',
            accessor: (run) => formatInstant(run.completedAt),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (run) => (
              <div className="flex flex-wrap gap-1">
                {canCancelEstimation(run) ? (
                  <Button size="sm" variant="ghost" onClick={() => void handleCancel(run)}>
                    Cancel
                  </Button>
                ) : null}
                {canMarkCurrent(run) && currentRun?.id !== run.id ? (
                  <Button size="sm" variant="ghost" onClick={() => void handleMarkCurrent(run)}>
                    Mark current
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <CreateEstimationRunModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        scheduleRuns={scheduleOptions}
        onSubmit={async (body) => {
          try {
            await createRun(body)
            toast.success('Estimation run started')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
