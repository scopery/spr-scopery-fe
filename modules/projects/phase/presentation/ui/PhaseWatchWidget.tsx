'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button, Card, Typography } from '@/shared/ui'
import { PhaseWatchFollowUpKind } from '../../domain/enums/phase-watch.enum'
import { usePhaseWatch } from '../hooks/usePhaseWatch'
import { PhaseFollowUpDrawer } from './PhaseFollowUpDrawer'
import { PhaseWatchTable } from './PhaseWatchRow'

interface PhaseWatchWidgetProps {
  workspaceId: string
  projectId?: string | null
  className?: string
}

export function PhaseWatchWidget({ workspaceId, projectId, className }: PhaseWatchWidgetProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filter, setFilter] = useState<string>(PhaseWatchFollowUpKind.All)
  const { rows, allRows, loading, error } = usePhaseWatch(workspaceId, {
    projectId,
    filter: drawerOpen ? filter : PhaseWatchFollowUpKind.All,
  })

  const previewRows = allRows.slice(0, 8)
  const empty = !loading && !error && previewRows.length === 0

  return (
    <>
      <Card as="section" className={className}>
        <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
          <div className="min-w-0">
            <Typography as="h2" size="sm" weight="semibold" className="text-neutral-900">
              Phase Watch
            </Typography>
            <Typography variant="small" tone="muted" className="mt-0.5">
              Phases covering today, plus what comes next
            </Typography>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none bg-neutral-100 px-1.5 text-neutral-700 hover:bg-neutral-200"
            onClick={() => setDrawerOpen(true)}
            aria-label="View all phases"
            title="View all phases"
          >
            <ArrowUpRight size={18} aria-hidden />
          </Button>
        </header>
        <div className="p-4">
          {loading && previewRows.length === 0 ? (
            <div className="space-y-2" aria-busy="true">
              <div className="h-3 w-2/3 bg-neutral-100" />
              <div className="h-3 w-1/2 bg-neutral-100" />
              <div className="h-24 w-full bg-neutral-50" />
            </div>
          ) : error ? (
            <Typography variant="small" className="text-error">
              {error}
            </Typography>
          ) : empty ? (
            <Typography variant="small" tone="muted">
              No projects with phases to watch.
            </Typography>
          ) : (
            <div>
              <PhaseWatchTable rows={previewRows} workspaceId={workspaceId} />
              {allRows.length > previewRows.length ? (
                <Typography variant="small" tone="muted" className="mt-2">
                  Showing {previewRows.length} of {allRows.length} projects
                </Typography>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      <PhaseFollowUpDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setFilter(PhaseWatchFollowUpKind.All)
        }}
        workspaceId={workspaceId}
        rows={rows}
        filter={filter}
        onFilterChange={setFilter}
        loading={loading}
      />
    </>
  )
}
