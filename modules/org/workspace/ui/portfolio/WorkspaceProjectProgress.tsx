'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { Badge, Button, DetailDrawer, Input, Select, Typography } from '@/shared/ui'
import type { PhaseWatchProjectRow } from '@/modules/projects/phase/domain/model/phase-watch'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import {
  formatShortDate,
  healthLabel,
  mapSignalToHealth,
  phaseReadinessPercent,
  type PortfolioHealth,
} from '../../domain/rules/portfolio.rules'
import { portfolioFollowUpTone, portfolioHealthTone } from './portfolioStatusTones'

interface WorkspaceProjectProgressProps {
  workspaceId: string
  rows: PhaseWatchProjectRow[]
  loading?: boolean
}

function ProjectProgressRow({
  row,
  workspaceId,
  onClick,
}: {
  row: PhaseWatchProjectRow
  workspaceId: string
  onClick: () => void
}) {
  const health = mapSignalToHealth(row.primarySignal)
  const active = row.activePhases[0] ?? null
  const next = row.nextPhase
  const readiness = phaseReadinessPercent(next)

  return (
    <li>
      <button
        type="button"
        className="w-full px-4 py-3 text-left transition-colors hover:bg-neutral-50"
        onClick={onClick}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Typography weight="semibold" className="text-neutral-900">
                {row.projectName}
              </Typography>
              <Badge variant="solid" size="sm" tone={portfolioHealthTone(health)}>
                {healthLabel(health)}
              </Badge>
            </div>
            {row.projectCode ? (
              <Typography variant="small" tone="muted" className="font-mono text-xs">
                {row.projectCode}
              </Typography>
            ) : null}
          </div>
          {row.unassignedTaskCount > 0 ? (
            <Badge variant="solid" size="sm" tone="progress">
              {row.unassignedTaskCount} unassigned
            </Badge>
          ) : null}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <Typography variant="small" tone="muted" className="text-xs uppercase tracking-wide">
              Active
            </Typography>
            {active ? (
              <>
                <Typography variant="small" weight="medium">
                  {active.code ? `${active.code} · ` : ''}{active.name}
                </Typography>
                <Typography variant="small" tone="muted">
                  {active.progressPercent != null ? `${active.progressPercent}%` : '—'}
                  {active.plannedEndDate ? ` · Ends ${formatShortDate(active.plannedEndDate)}` : ''}
                </Typography>
              </>
            ) : (
              <Typography variant="small" tone="muted">No active phase</Typography>
            )}
          </div>
          <div>
            <Typography variant="small" tone="muted" className="text-xs uppercase tracking-wide">
              Next
            </Typography>
            {next ? (
              <>
                <Typography variant="small" weight="medium">
                  {next.code ? `${next.code} · ` : ''}{next.name}
                </Typography>
                <Typography variant="small" tone="muted">
                  {next.plannedStartDate
                    ? `Planned ${formatShortDate(next.plannedStartDate)}`
                    : 'No start date'}
                  {readiness != null ? ` · ${readiness}% ready` : ''}
                </Typography>
              </>
            ) : (
              <Typography variant="small" tone="muted">No next phase</Typography>
            )}
          </div>
          <div>
            <Typography variant="small" tone="muted" className="text-xs uppercase tracking-wide">
              Follow-up
            </Typography>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {row.followUpLabels.slice(0, 3).map((label) => (
                <Badge key={label} variant="solid" size="sm" tone={portfolioFollowUpTone(label)}>
                  {label}
                </Badge>
              ))}
              {row.followUpLabels.length === 0 ? (
                <Typography variant="small" tone="muted">—</Typography>
              ) : null}
            </div>
          </div>
        </div>
      </button>
    </li>
  )
}

export function WorkspaceProjectProgress({
  workspaceId,
  rows,
  loading,
}: WorkspaceProjectProgressProps) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const preview = rows.slice(0, 5)

  const navigate = (projectId: string) =>
    router.push(WORKSPACE_ROUTES.projectDashboard(workspaceId, projectId))

  return (
    <section id="project-progress" className="border border-neutral-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div>
          <Typography as="h2" size="sm" weight="semibold">
            Project progress
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Active phase, next phase, readiness and unassigned work
          </Typography>
        </div>
        {rows.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none bg-neutral-100 px-1.5 text-neutral-700 hover:bg-neutral-200"
            onClick={() => setDrawerOpen(true)}
            aria-label="View all projects"
            title="View all projects"
          >
            <ArrowUpRight size={18} aria-hidden />
          </Button>
        ) : null}
      </header>

      {loading && rows.length === 0 ? (
        <div className="space-y-2 px-4 py-6" aria-busy="true">
          <div className="h-4 w-1/3 bg-neutral-100" />
          <div className="h-16 w-full bg-neutral-50" />
          <div className="h-16 w-full bg-neutral-50" />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            No projects match this filter.
          </Typography>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {preview.map((row) => (
            <ProjectProgressRow
              key={row.projectId}
              row={row}
              workspaceId={workspaceId}
              onClick={() => navigate(row.projectId)}
            />
          ))}
          {rows.length > 5 ? (
            <li className="px-4 py-2">
              <button
                type="button"
                className="text-sm text-neutral-500 hover:text-neutral-700"
                onClick={() => setDrawerOpen(true)}
              >
                +{rows.length - 5} more — view all
              </button>
            </li>
          ) : null}
        </ul>
      )}

      <ProjectProgressDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rows={rows}
        workspaceId={workspaceId}
      />
    </section>
  )
}

function ProjectProgressDrawer({
  open,
  onClose,
  rows,
  workspaceId,
}: {
  open: boolean
  onClose: () => void
  rows: PhaseWatchProjectRow[]
  workspaceId: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [healthFilter, setHealthFilter] = useState<'all' | PortfolioHealth>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const health = mapSignalToHealth(row.primarySignal)
      if (healthFilter !== 'all' && health !== healthFilter) return false
      if (!q) return true
      return (
        row.projectName.toLowerCase().includes(q) ||
        (row.projectCode ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, query, healthFilter])

  const navigate = (projectId: string) => {
    router.push(WORKSPACE_ROUTES.projectDashboard(workspaceId, projectId))
    onClose()
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Project progress"
      subtitle={`${rows.length} project${rows.length !== 1 ? 's' : ''}`}
      size="lg"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Projects…"
          className="h-8 w-48 rounded-none text-sm"
          aria-label="Search projects"
        />
        <Select
          size="sm"
          className="w-32"
          value={healthFilter}
          onValueChange={(v) => setHealthFilter(v as 'all' | PortfolioHealth)}
          placeholder="Health"
          options={[
            { value: 'all', label: 'Health' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'at_risk', label: 'At risk' },
            { value: 'on_track', label: 'On track' },
          ]}
          aria-label="Filter by health"
        />
      </div>

      {filtered.length === 0 ? (
        <Typography variant="small" tone="muted">
          No projects match this filter.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {filtered.map((row) => (
            <ProjectProgressRow
              key={row.projectId}
              row={row}
              workspaceId={workspaceId}
              onClick={() => navigate(row.projectId)}
            />
          ))}
        </ul>
      )}
    </DetailDrawer>
  )
}
