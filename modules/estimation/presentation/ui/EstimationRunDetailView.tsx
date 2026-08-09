'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
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
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import {
  useEstimationRunDetail,
  type EstimationRunDetailTab,
  type TaskIssueFilter,
} from '../hooks/useEstimationRunDetail'
import { RateImpactPreviewModal } from './RateImpactPreviewModal'
import {
  calculationModeLabel,
  canCancelEstimation,
  canMarkCurrent,
  estimationStatusLabel,
  estimationStatusTone,
  formatHours,
  isEstimationRunning,
  rateStrategyLabel,
  taskEstimateStatusLabel,
  taskEstimateStatusTone,
} from '../../domain/rules/estimation.rules'
import { EstimationRunStatus } from '../../domain/enums/estimation.enum'
import type { TaskEstimateSnapshot } from '../../domain/model/estimation'

const TABS: { id: EstimationRunDetailTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'wbs', label: 'Planning Element Rollup' },
  { id: 'phase', label: 'Phase Rollup' },
  { id: 'issues', label: 'Issues' },
  { id: 'assumptions', label: 'Assumptions' },
]

const TASK_FILTERS: { id: TaskIssueFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unresolved_role', label: 'Unresolved role' },
  { id: 'unresolved_rate', label: 'Unresolved rate' },
  { id: 'unestimated', label: 'Unestimated' },
  { id: 'excluded', label: 'Excluded' },
]

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

function money(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) {
    return (
      <Typography as="span" variant="small" tone="muted">
        —
      </Typography>
    )
  }
  return <CurrencyAmount amount={amount} currency={currency || 'USD'} size="sm" />
}

export function EstimationRunDetailView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const estimationRunId = params.estimationRunId as string

  const [previewTask, setPreviewTask] = useState<TaskEstimateSnapshot | null>(null)

  const { project } = useProject(workspaceId, projectId)
  const {
    tab,
    setTab,
    taskFilter,
    setTaskFilter,
    run,
    summary,
    tasks,
    issueTasks,
    wbsRollups,
    phaseRollups,
    loading,
    error,
    forbidden,
    cancelRun,
    markCurrent,
    previewRate,
  } = useEstimationRunDetail(projectId, estimationRunId)

  const handleCancel = async () => {
    try {
      await cancelRun()
      toast.success('Estimation run cancelled')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleMarkCurrent = async () => {
    if (!run) return
    const ok = window.confirm(`Mark “${run.name}” as the current estimate?`)
    if (!ok) return
    try {
      await markCurrent()
      toast.success('Current estimate updated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && !run) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this estimation run</Typography>
      </Card>
    )
  }

  if (error || !run) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error ?? 'Estimation run not found'}
        </Typography>
        <NextLink
          href={ROUTES.workspace.projectEstimation(workspaceId, projectId)}
          className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          Back to Estimation Center
        </NextLink>
      </div>
    )
  }

  const currency = summary?.currencyCode ?? run.currencyPolicy
  const kpiItems = summary
    ? [
        {
          id: 'hours',
          label: 'Estimate hours',
          value: (
            <Typography weight="semibold">{formatHours(summary.totalEstimateHours)}</Typography>
          ),
        },
        {
          id: 'labor',
          label: 'Labor cost',
          value: <CurrencyAmount amount={summary.totalLaborCost} currency={currency} />,
        },
        {
          id: 'billing',
          label: 'Billing preview',
          value: <CurrencyAmount amount={summary.totalBillingPreview} currency={currency} />,
        },
        {
          id: 'avgCost',
          label: 'Avg cost rate',
          value: <CurrencyAmount amount={summary.averageCostRate} currency={currency} />,
        },
        {
          id: 'avgBill',
          label: 'Avg billing rate',
          value: <CurrencyAmount amount={summary.averageBillingRate} currency={currency} />,
        },
      ]
    : []

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current={run.name}
      />

      <div className="mb-2 mt-1 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <NextLink
            href={ROUTES.workspace.projectEstimation(workspaceId, projectId)}
            className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            ← Estimation Center
          </NextLink>
          <Typography as="h1" size="md" weight="medium">
            {run.name}
          </Typography>
          <div className="mt-2 flex flex-wrap items-center gap-sm">
            <Badge tone={estimationStatusTone(run.status)}>
              {estimationStatusLabel(run.status)}
            </Badge>
            <Typography variant="small" tone="muted">
              {calculationModeLabel(run.calculationMode)} ·{' '}
              {rateStrategyLabel(run.rateTargetDateStrategy)} · {run.currencyPolicy}
            </Typography>
          </div>
          {run.description ? (
            <Typography variant="small" tone="muted" className="mt-2">
              {run.description}
            </Typography>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canCancelEstimation(run) ? (
            <Button variant="ghost" onClick={() => void handleCancel()}>
              Cancel
            </Button>
          ) : null}
          {canMarkCurrent(run) ? (
            <Button variant="secondary" onClick={() => void handleMarkCurrent()}>
              Mark current
            </Button>
          ) : null}
        </div>
      </div>

      {isEstimationRunning(run) ? (
        <LongRunningJobState
          className="mb-4"
          status={toJobStatus(run.status)}
          label={run.name}
          message="Calculating task estimates…"
        />
      ) : null}

      {run.status === EstimationRunStatus.Failed ? (
        <div className="border-error/30 bg-error/5 mb-4 border p-3">
          <Typography variant="small" tone="error">
            {run.errorCode ? `${run.errorCode}: ` : ''}
            {run.errorMessage ?? 'Estimation failed'}
          </Typography>
          {run.traceId ? (
            <Typography variant="caption" tone="muted" className="mt-1 block">
              Diagnostic reference available
            </Typography>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary'
                : 'px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' ? (
        <div>
          {summary ? (
            <>
              <FinancialKpiStrip items={kpiItems} mode="expanded" className="mb-4" />
              <div className="flex flex-wrap gap-sm">
                <Badge size="sm" tone="neutral">
                  Tasks: {summary.totalTaskCount}
                </Badge>
                <Badge size="sm" tone="neutral">
                  Included: {summary.includedTaskCount}
                </Badge>
                <Badge size="sm" tone="neutral">
                  Excluded: {summary.excludedTaskCount}
                </Badge>
                <Badge size="sm" tone="warning">
                  Unestimated: {summary.unestimatedTaskCount}
                </Badge>
                <Badge size="sm" tone="warning">
                  Unresolved role: {summary.unresolvedRoleTaskCount}
                </Badge>
                <Badge size="sm" tone="warning">
                  Unresolved rate: {summary.unresolvedRateTaskCount}
                </Badge>
                <Badge size="sm" tone={summary.warningCount > 0 ? 'warning' : 'success'}>
                  Warnings: {summary.warningCount}
                </Badge>
              </div>
            </>
          ) : (
            <Typography variant="small" tone="muted">
              Summary is available when the run completes.
            </Typography>
          )}
        </div>
      ) : null}

      {tab === 'tasks' ? (
        <div>
          <div className="mb-3 flex flex-wrap gap-1">
            {TASK_FILTERS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={taskFilter === f.id ? 'primary' : 'ghost'}
                onClick={() => setTaskFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <DataTable<TaskEstimateSnapshot>
            className="border border-neutral-200"
            ariaLabel="Task estimates"
            rows={tasks}
            rowKey={(task) => task.id}
            emptyMessage="No task snapshots"
            columns={[
              {
                id: 'task',
                header: 'Task',
                kind: 'code',
                cell: (t) => (
                  <>
                    <Typography variant="small">{t.taskCode || '—'}</Typography>
                    <Typography variant="caption" tone="muted" className="block">
                      {t.taskTitle || '—'}
                    </Typography>
                  </>
                ),
              },
              {
                id: 'role',
                header: 'Role',
                accessor: (t) => t.costRoleCode ?? '—',
                kind: 'reference',
              },
              { id: 'hours', header: 'Hours', accessor: (t) => formatHours(t.estimateHours) },
              {
                id: 'base',
                header: 'Base rate',
                cell: (t) => money(t.baseCostRate, t.currencyCode),
              },
              {
                id: 'adjusted',
                header: 'Adjusted',
                cell: (t) => money(t.adjustedCostRate, t.currencyCode),
              },
              {
                id: 'inflation',
                header: 'Inflation',
                accessor: (t) => (t.inflationPercent != null ? `${t.inflationPercent}%` : '—'),
              },
              {
                id: 'labor',
                header: 'Labor cost',
                cell: (t) => money(t.estimatedLaborCost, t.currencyCode),
              },
              {
                id: 'billing',
                header: 'Billing',
                cell: (t) => money(t.estimatedBillingPreview, t.currencyCode),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (t) => (
                  <>
                    <Badge size="sm" tone={taskEstimateStatusTone(t.status)}>
                      {taskEstimateStatusLabel(t.status)}
                    </Badge>
                    {t.issueCode ? (
                      <Typography variant="caption" tone="error" className="mt-0.5 block">
                        {t.issueCode}
                      </Typography>
                    ) : null}
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (t) => (
                  <Button size="sm" variant="ghost" onClick={() => setPreviewTask(t)}>
                    Rate preview
                  </Button>
                ),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === 'wbs' ? (
        <DataTable
          className="border border-neutral-200"
          ariaLabel="Planning element rollups"
          rows={wbsRollups}
          rowKey={(row) => row.id ?? row.wbsNodeId}
          emptyMessage="No planning element rollups"
          columns={[
            {
              id: 'wbs',
              header: 'Planning Element',
              kind: 'code',
              cell: (row) => (
                <>
                  <Typography variant="small">{row.wbsCode ?? '—'}</Typography>
                  {row.wbsTitle ? (
                    <Typography variant="caption" tone="muted" className="block">
                      {row.wbsTitle}
                    </Typography>
                  ) : null}
                </>
              ),
            },
            { id: 'tasks', header: 'Tasks', accessor: 'taskCount' },
            {
              id: 'hours',
              header: 'Hours',
              accessor: (row) => formatHours(row.totalEstimateHours),
            },
            {
              id: 'labor',
              header: 'Labor cost',
              cell: (row) => money(row.totalLaborCost, currency),
            },
            {
              id: 'billing',
              header: 'Billing',
              cell: (row) => money(row.totalBillingPreview, currency),
            },
            { id: 'warnings', header: 'Warnings', accessor: (row) => row.warningCount ?? 0 },
          ]}
        />
      ) : null}

      {tab === 'phase' ? (
        <DataTable
          className="border border-neutral-200"
          ariaLabel="Phase rollups"
          rows={phaseRollups}
          rowKey={(row) => row.id ?? row.phaseId}
          emptyMessage="No phase rollups"
          columns={[
            {
              id: 'phase',
              header: 'Phase',
              accessor: (row) => row.phaseName ?? '—',
              kind: 'reference',
            },
            {
              id: 'hours',
              header: 'Hours',
              accessor: (row) => formatHours(row.totalEstimateHours),
            },
            {
              id: 'labor',
              header: 'Labor cost',
              cell: (row) => money(row.totalLaborCost, currency),
            },
            {
              id: 'billing',
              header: 'Billing',
              cell: (row) => money(row.totalBillingPreview, currency),
            },
            { id: 'warnings', header: 'Warnings', accessor: (row) => row.warningCount ?? 0 },
          ]}
        />
      ) : null}

      {tab === 'issues' ? (
        <DataTable<TaskEstimateSnapshot>
          className="border border-neutral-200"
          ariaLabel="Estimation issues"
          rows={issueTasks}
          rowKey={(task) => task.id}
          emptyMessage="No issues in this run"
          columns={[
            {
              id: 'task',
              header: 'Task',
              accessor: (t) => `${t.taskCode || '—'} · ${t.taskTitle || '—'}`,
              kind: 'code',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (t) => (
                <Badge size="sm" tone={taskEstimateStatusTone(t.status)}>
                  {taskEstimateStatusLabel(t.status)}
                </Badge>
              ),
            },
            { id: 'issue', header: 'Issue', accessor: (t) => t.issueCode ?? '—' },
          ]}
        />
      ) : null}

      {tab === 'assumptions' ? (
        <Card className="border border-neutral-200 bg-neutral-50 p-4">
          {run.assumptionsJson == null ? (
            <Typography variant="small" tone="muted">
              No assumptions recorded for this run.
            </Typography>
          ) : (
            <pre className="overflow-x-auto text-xs text-neutral-700">
              {JSON.stringify(run.assumptionsJson, null, 2)}
            </pre>
          )}
        </Card>
      ) : null}

      <RateImpactPreviewModal
        open={previewTask != null}
        onClose={() => setPreviewTask(null)}
        task={previewTask}
        workspaceId={workspaceId}
        currencyCode={currency}
        onPreview={previewRate}
      />
    </div>
  )
}
