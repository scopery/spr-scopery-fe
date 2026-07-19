'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  CurrencyAmount,
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
  { id: 'wbs', label: 'WBS Rollup' },
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

function money(
  amount: number | null | undefined,
  currency: string | null | undefined
) {
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
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this estimation run</Typography>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="border border-error/30 bg-error/5 p-4">
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
          value: (
            <CurrencyAmount amount={summary.totalBillingPreview} currency={currency} />
          ),
        },
        {
          id: 'avgCost',
          label: 'Avg cost rate',
          value: <CurrencyAmount amount={summary.averageCostRate} currency={currency} />,
        },
        {
          id: 'avgBill',
          label: 'Avg billing rate',
          value: (
            <CurrencyAmount amount={summary.averageBillingRate} currency={currency} />
          ),
        },
      ]
    : []

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current={run.name}
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <NextLink
            href={ROUTES.workspace.projectEstimation(workspaceId, projectId)}
            className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            ← Estimation Center
          </NextLink>
          <Typography as="h1" size="lg" weight="semibold">
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
        <div className="mb-4 border border-error/30 bg-error/5 p-3">
          <Typography variant="small" tone="error">
            {run.errorCode ? `${run.errorCode}: ` : ''}
            {run.errorMessage ?? 'Estimation failed'}
          </Typography>
          {run.traceId ? (
            <Typography variant="caption" tone="muted" className="mt-1 block">
              Trace: {run.traceId}
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
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Task</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Hours</th>
                  <th className="px-3 py-2 font-medium">Base rate</th>
                  <th className="px-3 py-2 font-medium">Adjusted</th>
                  <th className="px-3 py-2 font-medium">Inflation</th>
                  <th className="px-3 py-2 font-medium">Labor cost</th>
                  <th className="px-3 py-2 font-medium">Billing</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No task snapshots
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2">
                        <Typography variant="small" weight="medium">
                          {t.taskCode}
                        </Typography>
                        <Typography variant="caption" tone="muted" className="block">
                          {t.taskTitle}
                        </Typography>
                      </td>
                      <td className="px-3 py-2">
                        <Typography variant="small" tone="muted">
                          {t.costRoleCode ?? '—'}
                        </Typography>
                      </td>
                      <td className="px-3 py-2">{formatHours(t.estimateHours)}</td>
                      <td className="px-3 py-2">{money(t.baseCostRate, t.currencyCode)}</td>
                      <td className="px-3 py-2">
                        {money(t.adjustedCostRate, t.currencyCode)}
                      </td>
                      <td className="px-3 py-2">
                        <Typography variant="small" tone="muted">
                          {t.inflationPercent != null ? `${t.inflationPercent}%` : '—'}
                        </Typography>
                      </td>
                      <td className="px-3 py-2">
                        {money(t.estimatedLaborCost, t.currencyCode)}
                      </td>
                      <td className="px-3 py-2">
                        {money(t.estimatedBillingPreview, t.currencyCode)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge size="sm" tone={taskEstimateStatusTone(t.status)}>
                          {taskEstimateStatusLabel(t.status)}
                        </Badge>
                        {t.issueCode ? (
                          <Typography variant="caption" tone="error" className="mt-0.5 block">
                            {t.issueCode}
                          </Typography>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewTask(t)}
                        >
                          Rate preview
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'wbs' ? (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">WBS</th>
                <th className="px-4 py-3 font-medium">Tasks</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Labor cost</th>
                <th className="px-4 py-3 font-medium">Billing</th>
                <th className="px-4 py-3 font-medium">Warnings</th>
              </tr>
            </thead>
            <tbody>
              {wbsRollups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No WBS rollups
                    </Typography>
                  </td>
                </tr>
              ) : (
                wbsRollups.map((row) => (
                  <tr
                    key={row.id ?? row.wbsNodeId}
                    className="border-t border-neutral-100"
                  >
                    <td className="px-4 py-3">
                      <Typography variant="small" weight="medium">
                        {row.wbsCode ?? row.wbsNodeId}
                      </Typography>
                      {row.wbsTitle ? (
                        <Typography variant="caption" tone="muted" className="block">
                          {row.wbsTitle}
                        </Typography>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{row.taskCount}</td>
                    <td className="px-4 py-3">{formatHours(row.totalEstimateHours)}</td>
                    <td className="px-4 py-3">{money(row.totalLaborCost, currency)}</td>
                    <td className="px-4 py-3">
                      {money(row.totalBillingPreview, currency)}
                    </td>
                    <td className="px-4 py-3">{row.warningCount ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'phase' ? (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Labor cost</th>
                <th className="px-4 py-3 font-medium">Billing</th>
                <th className="px-4 py-3 font-medium">Warnings</th>
              </tr>
            </thead>
            <tbody>
              {phaseRollups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No phase rollups
                    </Typography>
                  </td>
                </tr>
              ) : (
                phaseRollups.map((row) => (
                  <tr
                    key={row.id ?? row.phaseId}
                    className="border-t border-neutral-100"
                  >
                    <td className="px-4 py-3">
                      <Typography variant="small" weight="medium">
                        {row.phaseName ?? row.phaseId}
                      </Typography>
                    </td>
                    <td className="px-4 py-3">{formatHours(row.totalEstimateHours)}</td>
                    <td className="px-4 py-3">{money(row.totalLaborCost, currency)}</td>
                    <td className="px-4 py-3">
                      {money(row.totalBillingPreview, currency)}
                    </td>
                    <td className="px-4 py-3">{row.warningCount ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'issues' ? (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Issue</th>
              </tr>
            </thead>
            <tbody>
              {issueTasks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No issues in this run
                    </Typography>
                  </td>
                </tr>
              ) : (
                issueTasks.map((t) => (
                  <tr key={t.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      {t.taskCode} · {t.taskTitle}
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" tone={taskEstimateStatusTone(t.status)}>
                        {taskEstimateStatusLabel(t.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Typography variant="small" tone="error">
                        {t.issueCode ?? '—'}
                      </Typography>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'assumptions' ? (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          {run.assumptionsJson == null ? (
            <Typography variant="small" tone="muted">
              No assumptions recorded for this run.
            </Typography>
          ) : (
            <pre className="overflow-x-auto text-xs text-neutral-700">
              {JSON.stringify(run.assumptionsJson, null, 2)}
            </pre>
          )}
        </div>
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
