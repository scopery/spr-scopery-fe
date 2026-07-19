'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  LongRunningJobState,
  LongRunningJobStatus,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { FEATURES } from '@/config/features'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import {
  useBaselineDetail,
  type BaselineDetailTab,
} from '../hooks/useBaselineDetail'
import {
  baselineStatusLabel,
  baselineStatusTone,
  canApproveBaseline,
  canMarkBaselineCurrent,
  canValidateBaseline,
  readSummaryNumber,
  readValidationItems,
} from '../../domain/rules/project-control.rules'

const TABS: { id: BaselineDetailTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'snapshot', label: 'Snapshot' },
  { id: 'validation', label: 'Validation' },
  { id: 'sources', label: 'Sources' },
  { id: 'compare', label: 'Compare' },
  { id: 'metadata', label: 'Metadata' },
]

export function BaselineDetailView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const baselineId = params.baselineId as string

  const { project } = useProject(workspaceId, projectId)
  const h = useBaselineDetail(projectId, baselineId)

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
  const checks = readValidationItems(b.validationJson)
  const hours = readSummaryNumber(b.summaryJson, [
    'totalEstimateHours',
    'estimateHours',
    'hours',
  ])
  const cost = readSummaryNumber(b.summaryJson, ['totalCost', 'cost', 'budgetOfCosts'])
  const revenue = readSummaryNumber(b.summaryJson, ['plannedRevenue', 'revenue', 'totalRevenue'])
  const margin = readSummaryNumber(b.summaryJson, ['grossMarginPercent', 'marginPercent'])

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
            ← Baseline Register
          </NextLink>
          <Typography as="h1" size="lg" weight="semibold">
            {b.name}
          </Typography>
          <div className="mt-2 flex flex-wrap items-center gap-sm">
            <Badge tone={baselineStatusTone(b.status)}>{baselineStatusLabel(b.status)}</Badge>
            {b.currentFlag ? (
              <Badge tone="success" size="sm">
                Current
              </Badge>
            ) : null}
            <Typography variant="small" tone="muted">
              #{b.baselineNumber}
              {b.formulaVersion ? ` · Formula ${b.formulaVersion}` : ''}
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            icon={<RefreshCw size={16} />}
            loading={h.busy}
            onClick={() => void run('Snapshot refreshed', () => h.refresh())}
          >
            Refresh snapshot
          </Button>
          {canValidateBaseline(b) ? (
            <Button
              variant="secondary"
              loading={h.busy}
              onClick={() => void run('Validated', () => h.validate())}
            >
              Validate
            </Button>
          ) : null}
          {canApproveBaseline(b) ? (
            <Button
              variant="primary"
              loading={h.busy}
              onClick={() => {
                if (!window.confirm('Approve this baseline? It becomes read-only.')) return
                void run('Approved', () => h.approve())
              }}
            >
              Approve
            </Button>
          ) : null}
          {canMarkBaselineCurrent(b) ? (
            <Button
              variant="secondary"
              onClick={() => void run('Marked current', () => h.markCurrent())}
            >
              Mark current
            </Button>
          ) : null}
        </div>
      </div>

      {h.busy ? (
        <LongRunningJobState
          className="mb-4"
          status={LongRunningJobStatus.Running}
          label="Working"
          message="Refreshing or validating baseline on the server…"
        />
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => h.setTab(t.id)}
            className={
              h.tab === t.id
                ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary'
                : 'px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {h.tab === 'summary' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Estimate hours" value={hours != null ? String(hours) : '—'} />
          <SummaryCard label="Cost" value={cost != null ? String(cost) : '—'} />
          <SummaryCard label="Revenue" value={revenue != null ? String(revenue) : '—'} />
          <SummaryCard
            label="Margin %"
            value={margin != null ? `${margin}` : '—'}
          />
          {!b.summaryJson ? (
            <Typography variant="small" tone="muted" className="sm:col-span-2 lg:col-span-4">
              Typed summary fields appear when the backend provides `summaryJson`. Refresh
              snapshot after sources are set.
            </Typography>
          ) : null}
        </div>
      ) : null}

      {h.tab === 'snapshot' ? (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted" className="mb-2">
            Snapshot is stored as structured JSON until typed DTOs ship. Not the primary
            comparison UI.
          </Typography>
          {b.snapshotJson == null ? (
            <Typography variant="small" tone="muted">
              No snapshot yet — run Refresh snapshot.
            </Typography>
          ) : (
            <pre className="max-h-[28rem] overflow-auto text-xs text-neutral-700">
              {JSON.stringify(b.snapshotJson, null, 2)}
            </pre>
          )}
        </div>
      ) : null}

      {h.tab === 'validation' ? (
        <div className="space-y-2">
          {checks.length === 0 ? (
            <Typography variant="small" tone="muted">
              No validation results yet — run Validate.
            </Typography>
          ) : (
            checks.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 border border-neutral-200 px-3 py-2"
              >
                <Badge size="sm" tone={c.ok ? 'success' : 'warning'}>
                  {c.ok ? 'Pass' : 'Fail'}
                </Badge>
                <Typography variant="small" weight="medium">
                  {c.label}
                </Typography>
                {c.message ? (
                  <Typography variant="caption" tone="muted">
                    {c.message}
                  </Typography>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}

      {h.tab === 'sources' ? (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <tbody>
              {(
                [
                  ['Schedule run', b.sourceScheduleRunId],
                  ['Estimation run', b.sourceEstimationRunId],
                  ['Finance scenario', b.sourceFinanceScenarioId],
                  ['Quote version', b.sourceQuoteVersionId],
                ] as const
              ).map(([label, id]) => (
                <tr key={label} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-neutral-600">{label}</td>
                  <td className="px-4 py-3 font-mono text-xs">{id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {h.tab === 'compare' ? (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          {!FEATURES.wave3BaselineCompare ? (
            <Typography variant="small" tone="muted">
              Deep baseline compare is gated (`wave3BaselineCompare`) until BE compare
              endpoints exist (`/compare`, `/compare-current`). Do not diff large snapshots
              on the client.
            </Typography>
          ) : (
            <Typography variant="small">Compare UI placeholder.</Typography>
          )}
        </div>
      ) : null}

      {h.tab === 'metadata' ? (
        <div className="space-y-2 text-sm">
          <Typography variant="small" tone="muted">
            {b.description ?? 'No description'}
          </Typography>
          <Typography variant="small" tone="muted">
            Created {b.createdAt} · Updated {b.updatedAt}
          </Typography>
          {b.approvedAt ? (
            <Typography variant="small" tone="muted">
              Approved {b.approvedAt}
              {b.approvedBy ? ` by ${b.approvedBy}` : ''}
            </Typography>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 p-3">
      <Typography variant="overline" tone="muted">
        {label}
      </Typography>
      <Typography weight="semibold" className="mt-1">
        {value}
      </Typography>
    </div>
  )
}
