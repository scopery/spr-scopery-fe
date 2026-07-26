'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { MoreHorizontal, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  ContentLoader,
  DetailDrawer,
  LongRunningJobState,
  LongRunningJobStatus,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useBaselineDetail } from '../hooks/useBaselineDetail'
import type {
  BaselineCompareResponse,
  BaselineSummary,
  ProjectBaseline,
} from '../../domain/model/project-control'
import {
  baselineStatusLabel,
  baselineStatusTone,
  buildBaselineHealth,
  canApproveBaseline,
  canCaptureBaselineSnapshot,
  canMarkBaselineCurrent,
  canValidateBaseline,
  formatBaselineCapturedAt,
  formatDeltaValue,
  formatMetricNumber,
  formatMoneyMetric,
  mapBaselineSummaryToMetrics,
  mapProjectTree,
  shouldCreateUpdatedBaseline,
  type BaselineViewMode,
  type SnapshotTreeNode,
} from '../../domain/rules/project-control.rules'
import { BaselineApproveSheet, type ApproveOutcome } from './BaselineApproveSheet'

const VIEW_MODES: { id: BaselineViewMode; label: string }[] = [
  { id: 'baseline', label: 'Baseline' },
  { id: 'current', label: 'Current' },
  { id: 'difference', label: 'Difference' },
]

export function BaselineDetailView() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const baselineId = params.baselineId as string

  const { project } = useProject(workspaceId, projectId)
  const h = useBaselineDetail(projectId, baselineId)

  const [approveOpen, setApproveOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [devToolsOpen, setDevToolsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const run = async (ok: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success(ok)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (h.loading && !h.baseline) return <PageSkeleton variant="list" />
  if (h.forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this baseline</Typography>
      </div>
    )
  }
  if (h.error || !h.baseline) {
    return (
      <div className="border border-error/30 bg-error/5 p-4">
        <Typography variant="small" tone="error">
          {h.error ?? 'Baseline not found'}
        </Typography>
        <NextLink
          href={ROUTES.workspace.projectBaselines(workspaceId, projectId)}
          className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          Back to Baselines
        </NextLink>
      </div>
    )
  }

  const b = h.baseline
  const metrics = mapBaselineSummaryToMetrics(b.summary)
  const health = buildBaselineHealth(b)
  const tree = mapProjectTree(b.projectTree)
  const capturedLabel = formatBaselineCapturedAt(b.createdAt)
  const currency = metrics.currencyCode

  const handleApproveConfirm = async (outcome: ApproveOutcome) => {
    try {
      await h.approve()
      if (outcome === 'active') {
        await h.markCurrent()
        toast.success('Approved and set as active baseline')
      } else {
        toast.success('Approved as reference plan')
      }
      setApproveOpen(false)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current={b.name}
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <NextLink
            href={ROUTES.workspace.projectBaselines(workspaceId, projectId)}
            className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            ← Baselines
          </NextLink>
          <div className="flex flex-wrap items-center gap-2">
            <Typography as="h1" size="lg" weight="semibold">
              {b.name}
            </Typography>
            <Badge variant="solid" tone={baselineStatusTone(b.status)}>
              {baselineStatusLabel(b.status)}
            </Badge>
            {b.currentFlag ? (
              <Badge variant="solid" tone="success" size="sm">
                Active
              </Badge>
            ) : null}
          </div>
          <Typography variant="small" tone="muted" className="mt-1">
            {project?.name ? `Captured from ${project.name}` : 'Project Time Capsule'}
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Baseline #{b.baselineNumber} · {capturedLabel}
            {b.formulaVersion ? ` · Formula: ${b.formulaVersion}` : ''}
          </Typography>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          {canCaptureBaselineSnapshot(b) ? (
            <Button
              variant="ghost"
              icon={<RefreshCw size={16} />}
              loading={h.busy}
              onClick={() => void run('Latest project state captured', () => h.refresh())}
            >
              Capture latest project state
            </Button>
          ) : null}
          {shouldCreateUpdatedBaseline(b) ? (
            <Button
              variant="ghost"
              onClick={() =>
                router.push(
                  `${ROUTES.workspace.projectBaselines(workspaceId, projectId)}?create=1`
                )
              }
            >
              Create updated baseline
            </Button>
          ) : null}
          {canValidateBaseline(b) ? (
            <Button
              variant="secondary"
              loading={h.busy}
              onClick={() => void run('Baseline checked', () => h.validate())}
            >
              Check baseline
            </Button>
          ) : null}
          {canApproveBaseline(b) ? (
            <Button variant="primary" loading={h.busy} onClick={() => setApproveOpen(true)}>
              Approve as reference plan
            </Button>
          ) : null}
          {canMarkBaselineCurrent(b) ? (
            <Button
              variant="secondary"
              onClick={() => void run('Now the active baseline', () => h.markCurrent())}
            >
              Use as active baseline
            </Button>
          ) : null}
          <Button
            variant="ghost"
            aria-label="More actions"
            onClick={() => setMenuOpen((v) => !v)}
            icon={<MoreHorizontal size={16} />}
          />
          {menuOpen ? (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] border border-neutral-200 bg-white py-1 shadow-md">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                onClick={() => {
                  setSourcesOpen(true)
                  setMenuOpen(false)
                }}
              >
                View capture details
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                onClick={() => {
                  setDevToolsOpen(true)
                  setMenuOpen(false)
                }}
              >
                Developer tools
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {h.busy ? (
        <LongRunningJobState
          className="mb-4"
          status={LongRunningJobStatus.Running}
          label="Working"
          message="Updating baseline on the server…"
        />
      ) : null}

      <div
        className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200"
        role="tablist"
        aria-label="Baseline view mode"
      >
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={h.viewMode === mode.id}
            onClick={() => h.setViewMode(mode.id)}
            className={cn(
              'px-3 py-2 text-sm',
              h.viewMode === mode.id
                ? 'border-b-2 border-primary font-medium text-primary'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {h.viewMode === 'baseline' ? (
        <div className="space-y-4">
          <SummaryMetricsPanel
            title="Project Time Capsule"
            metrics={metrics}
            empty={!b.summary}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="border border-neutral-200 bg-white p-4">
              <Typography variant="overline" tone="muted">
                Project map
              </Typography>
              <div className="mt-3">
                {!b.summary && (!b.projectTree || b.projectTree.length === 0) ? (
                  <Typography variant="small" tone="muted">
                    No snapshot yet — capture the latest project state.
                  </Typography>
                ) : tree.length === 0 ? (
                  <Typography variant="small" tone="muted">
                    Typed project tree is empty for this baseline.
                  </Typography>
                ) : (
                  <SnapshotTree nodes={tree} />
                )}
              </div>
            </section>

            <aside className="border border-neutral-200 bg-white p-4">
              <Typography variant="overline" tone="muted">
                Baseline health
              </Typography>
              <dl className="mt-3 space-y-3 text-sm">
                <HealthRow
                  label="Snapshot"
                  value={health.snapshotStatus}
                  tone={health.snapshotReady ? 'ok' : 'warn'}
                />
                <HealthRow
                  label="Issues"
                  value={
                    health.warnings + health.blocking === 0
                      ? health.snapshotStatus === 'DRAFT'
                        ? 'Not run'
                        : 'None'
                      : `${health.blocking} blocking · ${health.warnings} warnings`
                  }
                  tone={
                    health.blocking > 0 || health.warnings > 0 ? 'warn' : 'ok'
                  }
                />
                <HealthRow label="Sources" value={health.sourcesLabel} />
                <HealthRow
                  label="Approval"
                  value={health.approvalLabel}
                  asSolidBadge
                />
              </dl>

              {health.sourceChecks.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
                  {health.sourceChecks.map((s) => (
                    <li key={s.source} className="flex items-center justify-between gap-2 text-xs">
                      <span className="capitalize text-neutral-600">{s.source}</span>
                      {isSolidStatusLabel(s.status) ? (
                        <StatusPill value={s.status} />
                      ) : (
                        <span className="font-medium text-neutral-900">{s.status}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}

              {health.issues.length > 0 ? (
                <div className="mt-4 border-t border-neutral-100 pt-3">
                  <Typography variant="small" weight="medium">
                    {health.issues.length} item
                    {health.issues.length === 1 ? '' : 's'} need attention
                  </Typography>
                  <ul className="mt-2 space-y-2">
                    {health.issues.slice(0, 4).map((issue) => (
                      <li key={issue.id}>
                        <Typography variant="small" weight="medium">
                          {issue.label}
                        </Typography>
                        {issue.message ? (
                          <Typography variant="caption" tone="muted" className="block">
                            {issue.message}
                          </Typography>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 border-t border-neutral-100 pt-3">
                <Typography variant="overline" tone="muted">
                  Next step
                </Typography>
                <Typography variant="small" className="mt-1">
                  {health.nextStep}
                </Typography>
              </div>
            </aside>
          </div>

          <WhatChangedPreview
            compare={h.compare}
            onOpenDifference={() => h.setViewMode('difference')}
          />

          <section className="border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Typography variant="overline" tone="muted">
                  Captured from
                </Typography>
                <Typography variant="small" className="mt-1">
                  Schedule, estimation, finance, and quote sources linked at capture
                  time.
                </Typography>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSourcesOpen(true)}>
                View capture details
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {h.viewMode === 'current' ? (
        <CompareSideView
          title={h.compare?.right.label ?? 'Current plan'}
          summary={h.compare?.right.summary ?? null}
          loading={h.compareLoading}
          error={h.compareError}
          onRetry={() => void h.refetchCompare()}
        />
      ) : null}

      {h.viewMode === 'difference' ? (
        <DifferenceView
          compare={h.compare}
          loading={h.compareLoading}
          error={h.compareError}
          currency={currency}
          onRetry={() => void h.refetchCompare()}
        />
      ) : null}

      <BaselineApproveSheet
        open={approveOpen}
        baseline={b}
        busy={h.busy}
        onClose={() => setApproveOpen(false)}
        onConfirm={(outcome) => void handleApproveConfirm(outcome)}
      />

      <DetailDrawer
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        title="Captured from"
        subtitle="Provenance for this baseline"
      >
        <ProvenanceList baseline={b} />
      </DetailDrawer>

      <DetailDrawer
        open={devToolsOpen}
        onClose={() => setDevToolsOpen(false)}
        title="Developer tools"
        subtitle="Typed baseline payload"
        size="lg"
      >
        <div className="space-y-4">
          {(
            [
              ['summary', b.summary],
              ['projectTree', b.projectTree],
              ['health', b.health],
              ['provenance', b.provenance],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <Typography variant="small" weight="medium" className="mb-2">
                {label}
              </Typography>
              <pre className="max-h-56 overflow-auto border border-neutral-200 bg-neutral-50 p-3 text-xs">
                {value == null ? 'null' : JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </DetailDrawer>
    </div>
  )
}

function SummaryMetricsPanel({
  title,
  metrics,
  empty,
}: {
  title: string
  metrics: ReturnType<typeof mapBaselineSummaryToMetrics>
  empty?: boolean
}) {
  return (
    <section className="border border-neutral-200 bg-white p-4">
      <Typography variant="overline" tone="muted">
        {title}
      </Typography>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricBlock
          label="Scope"
          primary={
            metrics.phaseCount != null
              ? `${formatMetricNumber(metrics.phaseCount)} Phases`
              : '—'
          }
          secondary={
            metrics.wbsCount != null
              ? `${formatMetricNumber(metrics.wbsCount)} WBS`
              : undefined
          }
        />
        <MetricBlock
          label="Schedule"
          primary={
            metrics.scheduleStart && metrics.scheduleEnd
              ? `${metrics.scheduleStart}–${metrics.scheduleEnd}`
              : '—'
          }
          secondary={
            metrics.milestoneCount != null
              ? `${formatMetricNumber(metrics.milestoneCount)} milestones`
              : undefined
          }
        />
        <MetricBlock
          label="Effort"
          primary={formatMetricNumber(metrics.estimateHours, 'h')}
          secondary={
            metrics.taskCount != null
              ? `${formatMetricNumber(metrics.taskCount)} tasks`
              : undefined
          }
        />
        <MetricBlock
          label="Financials"
          primary={formatMoneyMetric(metrics.cost, metrics.currencyCode)}
          secondary={
            metrics.marginPercent != null
              ? `${formatMetricNumber(metrics.marginPercent)}% target margin`
              : metrics.revenue != null
                ? `${formatMoneyMetric(metrics.revenue, metrics.currencyCode)} revenue`
                : undefined
          }
        />
      </div>
      {empty ? (
        <Typography variant="small" tone="muted" className="mt-3">
          Summary metrics appear after the snapshot is captured.
        </Typography>
      ) : null}
    </section>
  )
}

function WhatChangedPreview({
  compare,
  onOpenDifference,
}: {
  compare: BaselineCompareResponse | null
  onOpenDifference: () => void
}) {
  return (
    <section className="border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="overline" tone="muted">
          What changed
        </Typography>
        <Button size="sm" variant="ghost" onClick={onOpenDifference}>
          Review changes
        </Button>
      </div>
      {compare ? (
        <div className="mt-3 space-y-2">
          {compare.highlights.slice(0, 4).map((line) => (
            <Typography key={line} variant="small">
              • {line}
            </Typography>
          ))}
          {compare.highlights.length === 0 ? (
            <Typography variant="small" tone="muted">
              No material changes highlighted versus the current plan.
            </Typography>
          ) : null}
          <Typography variant="caption" tone="muted" className="block pt-1">
            Tasks +{compare.changeCounts.tasksAdded} / −{compare.changeCounts.tasksRemoved}
            {' · '}
            WBS +{compare.changeCounts.wbsAdded} / −{compare.changeCounts.wbsRemoved}
          </Typography>
        </div>
      ) : (
        <Typography variant="small" tone="muted" className="mt-2">
          Open the Difference tab to compare this baseline with the live project plan.
        </Typography>
      )}
    </section>
  )
}

function CompareSideView({
  title,
  summary,
  loading,
  error,
  onRetry,
}: {
  title: string
  summary: BaselineSummary | null
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading && !summary) return <ContentLoader />
  if (error && !summary) {
    return (
      <div className="border border-neutral-200 bg-neutral-50 p-6">
        <Typography variant="small" tone="muted">
          {error}
        </Typography>
        <Button
          size="sm"
          variant="ghost"
          className="mt-2"
          icon={<RefreshCw size={14} />}
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    )
  }
  return (
    <SummaryMetricsPanel
      title={title}
      metrics={mapBaselineSummaryToMetrics(summary)}
      empty={!summary}
    />
  )
}

function DifferenceView({
  compare,
  loading,
  error,
  currency,
  onRetry,
}: {
  compare: BaselineCompareResponse | null
  loading: boolean
  error: string | null
  currency: string | null
  onRetry: () => void
}) {
  if (loading && !compare) return <ContentLoader />
  if (error && !compare) {
    return (
      <div className="border border-neutral-200 bg-neutral-50 p-6">
        <Typography variant="small" tone="muted">
          {error}
        </Typography>
        <Button
          size="sm"
          variant="ghost"
          className="mt-2"
          icon={<RefreshCw size={14} />}
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    )
  }
  if (!compare) {
    return (
      <div className="border border-neutral-200 bg-neutral-50 p-6">
        <Typography variant="small" tone="muted">
          No compare data yet.
        </Typography>
      </div>
    )
  }

  const counts = compare.changeCounts

  return (
    <div className="space-y-4">
      <section className="border border-neutral-200 bg-white p-4">
        <Typography variant="overline" tone="muted">
          Compare
        </Typography>
        <Typography variant="small" className="mt-2">
          {compare.left.label} → {compare.right.label}
        </Typography>
        {compare.highlights.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {compare.highlights.map((line) => (
              <li key={line}>
                <Typography variant="small">• {line}</Typography>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="border border-neutral-200 bg-white p-4">
        <Typography variant="overline" tone="muted">
          Metric deltas
        </Typography>
        <div className="mt-3 divide-y divide-neutral-100">
          {compare.deltas.length === 0 ? (
            <Typography variant="small" tone="muted">
              No numeric deltas.
            </Typography>
          ) : (
            compare.deltas.map((d) => (
              <div
                key={d.field}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium text-neutral-900">{d.label}</span>
                <span className="text-neutral-600">
                  {formatDeltaValue(d.baseline)} → {formatDeltaValue(d.current)}
                  {d.direction ? (
                    <span
                      className={cn(
                        'ml-2 text-xs font-medium uppercase',
                        d.direction.toUpperCase() === 'UP' && 'text-warning',
                        d.direction.toUpperCase() === 'DOWN' && 'text-success',
                        d.direction.toUpperCase() === 'SAME' && 'text-neutral-500'
                      )}
                    >
                      {d.direction}
                    </span>
                  ) : null}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-4">
        <Typography variant="overline" tone="muted">
          Structural changes
        </Typography>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <CountChip
            label="Phases"
            added={counts.phasesAdded}
            removed={counts.phasesRemoved}
          />
          <CountChip label="WBS" added={counts.wbsAdded} removed={counts.wbsRemoved} />
          <CountChip
            label="Tasks"
            added={counts.tasksAdded}
            removed={counts.tasksRemoved}
          />
          <CountChip
            label="Milestones"
            added={counts.milestonesAdded}
            removed={counts.milestonesRemoved}
          />
        </div>
        {currency ? (
          <Typography variant="caption" tone="muted" className="mt-3 block">
            Currency context: {currency}
          </Typography>
        ) : null}
      </section>
    </div>
  )
}

function CountChip({
  label,
  added,
  removed,
}: {
  label: string
  added: number
  removed: number
}) {
  return (
    <div className="border border-neutral-100 px-3 py-2">
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography variant="small" weight="medium" className="mt-1">
        +{added} · −{removed}
      </Typography>
    </div>
  )
}

function MetricBlock({
  label,
  primary,
  secondary,
}: {
  label: string
  primary: string
  secondary?: string
}) {
  return (
    <div>
      <Typography variant="overline" tone="muted">
        {label}
      </Typography>
      <Typography weight="semibold" className="mt-1">
        {primary}
      </Typography>
      {secondary ? (
        <Typography variant="small" tone="muted" className="mt-0.5">
          {secondary}
        </Typography>
      ) : null}
    </div>
  )
}

function isSolidStatusLabel(value: string): boolean {
  return value.trim().toUpperCase() === 'MISSING'
}

function approvalStatusTone(
  value: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'progress' {
  const v = value.trim().toUpperCase()
  if (v.includes('ACTIVE') || v === 'APPROVED') return 'success'
  if (v === 'VALIDATED') return 'progress'
  if (v === 'ARCHIVED') return 'neutral'
  if (v === 'PENDING' || v === 'DRAFT') return 'info'
  return 'info'
}

function StatusPill({
  value,
  tone,
}: {
  value: string
  tone?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'progress'
}) {
  return (
    <Badge variant="solid" size="sm" tone={tone ?? 'warning'}>
      {value}
    </Badge>
  )
}

function HealthRow({
  label,
  value,
  tone = 'neutral',
  asSolidBadge = false,
}: {
  label: string
  value: string
  tone?: 'ok' | 'warn' | 'neutral'
  asSolidBadge?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-600">{label}</dt>
      <dd>
        {asSolidBadge ? (
          <StatusPill value={value} tone={approvalStatusTone(value)} />
        ) : isSolidStatusLabel(value) ? (
          <StatusPill value={value} tone="warning" />
        ) : (
          <span
            className={cn(
              'text-right font-medium',
              tone === 'ok' && 'text-neutral-900',
              tone === 'warn' && 'text-warning',
              tone === 'neutral' && 'text-neutral-900'
            )}
          >
            {value}
          </span>
        )}
      </dd>
    </div>
  )
}

function SnapshotTree({ nodes, depth = 0 }: { nodes: SnapshotTreeNode[]; depth?: number }) {
  return (
    <ul className={cn(depth > 0 && 'ml-3 border-l border-neutral-200 pl-3')}>
      {nodes.map((node) => (
        <li key={node.id} className="py-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <Typography variant="small" weight={depth === 0 ? 'medium' : 'normal'}>
              {node.label}
            </Typography>
            {node.meta ? (
              <Typography variant="caption" tone="muted">
                {node.meta}
              </Typography>
            ) : null}
          </div>
          {node.children && node.children.length > 0 ? (
            <SnapshotTree nodes={node.children} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function ProvenanceList({ baseline }: { baseline: ProjectBaseline }) {
  const entries = baseline.provenance?.sources ?? []

  if (entries.length === 0) {
    const fallback = [
      { label: 'Schedule', id: baseline.sourceScheduleRunId },
      { label: 'Estimation', id: baseline.sourceEstimationRunId },
      { label: 'Finance', id: baseline.sourceFinanceScenarioId },
      { label: 'Quote', id: baseline.sourceQuoteVersionId },
    ]
    return (
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Captured {formatBaselineCapturedAt(baseline.createdAt)}
        </Typography>
        {fallback.map((row) => (
          <div key={row.label} className="border-b border-neutral-100 pb-3">
            <Typography variant="small" weight="medium">
              {row.label}
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
              {row.id ?? 'Not captured'}
            </Typography>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Typography variant="small" tone="muted">
        Captured {formatBaselineCapturedAt(baseline.createdAt)}
      </Typography>
      {entries.map((entry) => (
        <div key={`${entry.source}-${entry.id ?? 'none'}`} className="border-b border-neutral-100 pb-3">
          <Typography variant="small" weight="medium" className="capitalize">
            {entry.label ?? entry.source}
          </Typography>
          {entry.status ? (
            <Typography variant="caption" tone="muted" className="mt-0.5 block">
              {entry.status}
            </Typography>
          ) : null}
          <Typography variant="caption" tone="muted" className="mt-1 block font-mono">
            {entry.id ?? '—'}
          </Typography>
          {entry.capturedAt ? (
            <Typography variant="caption" tone="muted" className="mt-1 block">
              {formatBaselineCapturedAt(entry.capturedAt)}
            </Typography>
          ) : null}
        </div>
      ))}
    </div>
  )
}
