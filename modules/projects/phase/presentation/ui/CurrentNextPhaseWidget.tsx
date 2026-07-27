'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge, Button, Progress, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import type { ProjectPhase } from '../../domain/model/phase'
import type { ProjectTask } from '../../../task/domain/model/task'
import { useCurrentNextPhase } from '../hooks/useCurrentNextPhase'
import {
  formatPhaseWatchDate,
  phaseDisplayTitle,
} from '../../domain/rules/phase-watch.rules'
import { PhaseSignalBadge } from './PhaseWatchRow'

interface CurrentNextPhaseWidgetProps {
  workspaceId: string
  projectId: string
  projectName: string
  projectCode?: string | null
  phases: ProjectPhase[]
  tasks: ProjectTask[]
  loading?: boolean
}

export function CurrentNextPhaseWidget({
  workspaceId,
  projectId,
  projectName,
  projectCode,
  phases,
  tasks,
  loading,
}: CurrentNextPhaseWidgetProps) {
  const row = useCurrentNextPhase({
    projectId,
    projectName,
    projectCode,
    phases,
    tasks,
  })

  if (loading) {
    return (
      <section className="border border-neutral-200 bg-white p-5">
        <Typography as="h2" weight="semibold" className="mb-4">
          Current and next Phase
        </Typography>
        <div className="space-y-2" aria-busy="true">
          <div className="h-3 w-2/3 bg-neutral-100" />
          <div className="h-3 w-1/2 bg-neutral-100" />
        </div>
      </section>
    )
  }

  if (phases.length === 0) {
    return (
      <section className="border border-neutral-200 bg-white p-5">
        <Typography as="h2" weight="semibold" className="mb-4">
          Current and next Phase
        </Typography>
        <Typography tone="muted" variant="small">
          No phases yet. Add them in project settings.
        </Typography>
        <Link
          href={ROUTES.workspace.projectSettings(workspaceId, projectId)}
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Manage phases <ArrowRight size={14} />
        </Link>
      </section>
    )
  }

  return (
    <section className="border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <Typography as="h2" weight="semibold">
          Current and next Phase
        </Typography>
        <PhaseSignalBadge signal={row.primarySignal} />
      </div>

      <div className="space-y-5">
        <div>
          <Typography variant="small" tone="muted" weight="medium" className="mb-2 uppercase tracking-wide">
            Current
            {row.activePhases.length > 1 ? ` · ${row.activePhases.length}` : ''}
          </Typography>
          {row.activePhases.length === 0 ? (
            <Typography variant="small" tone="muted">
              No current phase
            </Typography>
          ) : (
            <ul className="space-y-3">
              {row.activePhases.map((phase) => (
                <li key={phase.phaseId} className="space-y-1.5">
                  <Typography size="sm" weight="semibold">
                    {phaseDisplayTitle(phase)}
                  </Typography>
                  <Typography variant="small" tone="muted">
                    {phase.progressPercent == null
                      ? 'No tasks yet'
                      : `${phase.progressPercent}% complete`}
                    {phase.plannedEndDate
                      ? ` · Planned finish ${formatPhaseWatchDate(phase.plannedEndDate)}`
                      : ''}
                  </Typography>
                  {phase.progressPercent != null ? (
                    <Progress value={phase.progressPercent} size="sm" />
                  ) : null}
                  {phase.blockedTaskCount > 0 ? (
                    <Badge variant="solid" tone="error" className="rounded-none">
                      {phase.blockedTaskCount} blocked
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <Typography variant="small" tone="muted" weight="medium" className="mb-2 uppercase tracking-wide">
            Next
          </Typography>
          {row.nextPhase ? (
            <div className="space-y-1.5">
              <Typography size="sm" weight="semibold">
                {phaseDisplayTitle(row.nextPhase)}
              </Typography>
              <Typography variant="small" tone="muted">
                {row.nextPhase.plannedStartDate
                  ? `Planned start ${formatPhaseWatchDate(row.nextPhase.plannedStartDate)}`
                  : 'Start date not scheduled'}
              </Typography>
              {row.followUpLabels.filter((l) => l !== 'Ready').length > 0 ? (
                <Typography variant="small" className="text-neutral-700">
                  {row.followUpLabels.filter((l) => l !== 'Ready').join(' · ')}
                </Typography>
              ) : (
                <Typography variant="small" tone="muted">
                  Ready
                </Typography>
              )}
            </div>
          ) : (
            <Typography variant="small" tone="muted">
              No upcoming phase
            </Typography>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href={ROUTES.workspace.projectWork(workspaceId, projectId)}>
          <Button variant="outline" size="sm" className="rounded-none">
            Open work items
          </Button>
        </Link>
        <Link
          href={ROUTES.workspace.projectSettings(workspaceId, projectId)}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Manage phases <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}
