'use client'

import { useEffect } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import {
  Badge,
  Button,
  LongRunningJobState,
  LongRunningJobStatus,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import {
  useProjectResourcePlan,
  type ProjectResourcePlanTab,
} from '../hooks/useProjectResourcePlan'
import { formatHours, formatPercent } from '../../domain/rules/capacity.rules'
import { AssignmentConflictStatus, ResourceRiskStatus } from '../../domain/model/project-resource-plan'
import { CapacityEntityStatus } from '../../domain/enums/capacity.enum'

const TABS: { id: ProjectResourcePlanTab; label: string }[] = [
  { id: 'team', label: 'Team' },
  { id: 'allocations', label: 'Allocations' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'conflicts', label: 'Conflicts & Risks' },
  { id: 'cost', label: 'Cost Inputs' },
]

export function ProjectResourcePlanView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const {
    tab,
    setTab,
    allocations,
    summary,
    risks,
    conflicts,
    costInputs,
    loading,
    error,
    jobStatus,
    jobMessage,
    runRebuild,
    loadCostInputs,
    acknowledgeConflict,
    recalculateConflicts,
    mitigateRisk,
    closeRisk,
    resourceLabel,
  } = useProjectResourcePlan(workspaceId, projectId)

  useEffect(() => {
    if (tab === 'cost') void loadCostInputs()
  }, [tab, loadCostInputs])

  if (loading && allocations.length === 0) return <PageSkeleton variant="list" />
  if (error) {
    return (
      <div className="border border-error/30 bg-error/5 p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Project Resource Plan
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Team demand, allocations, forecast rebuilds, conflicts and risks.
          </Typography>
        </div>
        <NextLink
          href={ROUTES.workspace.projectResourcesEffort(workspaceId, projectId)}
          className="inline-flex"
        >
          <Button variant="secondary" type="button">
            Effort & Workload
          </Button>
        </NextLink>
      </div>

      {summary ? (
        <div className="mb-4 flex flex-wrap gap-md border border-neutral-200 bg-white px-4 py-3">
          <div>
            <Typography variant="caption" tone="muted">
              Members
            </Typography>
            <Typography weight="medium">{summary.memberCount ?? '—'}</Typography>
          </div>
          <div>
            <Typography variant="caption" tone="muted">
              Allocated %
            </Typography>
            <Typography weight="medium">
              {formatPercent(summary.totalAllocatedPercent)}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" tone="muted">
              Allocated hours
            </Typography>
            <Typography weight="medium">
              {formatHours(summary.totalAllocatedHours)}
            </Typography>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {jobStatus !== LongRunningJobStatus.Idle ? (
        <div className="mb-4">
          <LongRunningJobState status={jobStatus} label={jobMessage ?? undefined} />
        </div>
      ) : null}

      {tab === 'team' || tab === 'allocations' ? (
        <div className="border border-neutral-200 bg-white">
          {allocations.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Typography tone="muted" variant="small">
                No allocations on this project yet.
              </Typography>
              <NextLink
                href={ROUTES.workspace.capacityAllocations(workspaceId)}
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Open Allocation Planner
              </NextLink>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Resource</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">%</th>
                    <th className="px-3 py-2 font-medium">Period</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((a) => (
                    <tr key={a.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2">{resourceLabel(a.workspaceMemberId)}</td>
                      <td className="px-3 py-2">{a.allocationType}</td>
                      <td className="px-3 py-2">{a.allocationPercent}%</td>
                      <td className="px-3 py-2">
                        {a.startDate} → {a.endDate}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          size="sm"
                          tone={
                            a.status === CapacityEntityStatus.Active ? 'success' : 'neutral'
                          }
                        >
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'forecast' ? (
        <div className="flex flex-wrap gap-sm border border-neutral-200 bg-white p-md">
          <Button
            variant="secondary"
            loading={jobStatus === LongRunningJobStatus.Running}
            onClick={() => void runRebuild('forecast')}
          >
            Rebuild effort forecast
          </Button>
          <Button
            variant="secondary"
            loading={jobStatus === LongRunningJobStatus.Running}
            onClick={() => void runRebuild('capacity')}
          >
            Rebuild capacity summary
          </Button>
          <Typography variant="caption" tone="muted" className="w-full">
            Rebuild actions are synchronous until the backend exposes job progress.
          </Typography>
        </div>
      ) : null}

      {tab === 'conflicts' ? (
        <div className="grid gap-md lg:grid-cols-2">
          <div className="border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <Typography weight="semibold" variant="small">
                Conflicts ({conflicts.length})
              </Typography>
              <Button size="sm" variant="ghost" onClick={() => void recalculateConflicts()}>
                Recalculate
              </Button>
            </div>
            {conflicts.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Typography tone="muted" variant="small">
                  No assignment conflicts.
                </Typography>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {conflicts.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-xs">
                      <Badge size="sm" tone="warning">
                        {c.severity}
                      </Badge>
                      <Badge size="sm" tone="neutral">
                        {c.status}
                      </Badge>
                      <Typography variant="small">{c.conflictType}</Typography>
                    </div>
                    <Typography variant="caption" tone="muted" className="mt-1 block">
                      {c.description ?? '—'}
                    </Typography>
                    {c.status === AssignmentConflictStatus.Open ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1"
                        onClick={() => void acknowledgeConflict(c.id)}
                      >
                        Acknowledge
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
              <Typography weight="semibold" variant="small">
                Risk flags ({risks.length})
              </Typography>
            </div>
            {risks.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Typography tone="muted" variant="small">
                  No resource risk flags.
                </Typography>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {risks.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap gap-xs">
                      <Badge size="sm" tone="error">
                        {r.riskReason}
                      </Badge>
                      <Badge size="sm" tone="neutral">
                        {r.status}
                      </Badge>
                    </div>
                    <Typography variant="caption" tone="muted" className="mt-1 block">
                      {r.impactType} · {r.description ?? '—'}
                    </Typography>
                    <div className="mt-1 flex gap-1">
                      {r.status === ResourceRiskStatus.Open ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void mitigateRisk(r.id)}
                        >
                          Mitigate
                        </Button>
                      ) : null}
                      {r.status !== ResourceRiskStatus.Closed ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void closeRisk(r.id)}
                        >
                          Close
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'cost' ? (
        <div className="border border-neutral-200 bg-white p-md">
          <div className="mb-3 flex flex-wrap gap-sm">
            <Button variant="secondary" onClick={() => void loadCostInputs()}>
              Refresh cost inputs
            </Button>
            <Button
              variant="secondary"
              loading={jobStatus === LongRunningJobStatus.Running}
              onClick={() => void runRebuild('cost')}
            >
              Rebuild cost inputs
            </Button>
          </div>
          <Typography variant="caption" tone="muted" className="mb-2 block">
            Loaded without sensitive fields. Typed cost breakdown UI awaits a stable DTO;
            rebuild is available now.
          </Typography>
          <Typography variant="small">
            {costInputs == null
              ? 'No cost inputs loaded.'
              : 'Cost inputs loaded. Open rebuild if figures look stale.'}
          </Typography>
        </div>
      ) : null}
    </div>
  )
}
