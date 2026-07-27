'use client'

import { Button, DetailDrawer, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { PhaseWatchFollowUpKind } from '../../domain/enums/phase-watch.enum'
import type { PhaseWatchProjectRow } from '../../domain/model/phase-watch'
import { PhaseWatchTable } from './PhaseWatchRow'

const FILTERS: { value: string; label: string }[] = [
  { value: PhaseWatchFollowUpKind.All, label: 'All' },
  { value: PhaseWatchFollowUpKind.EndingSoon, label: 'Ending soon' },
  { value: PhaseWatchFollowUpKind.StartingSoon, label: 'Starting soon' },
  { value: PhaseWatchFollowUpKind.HasBlockers, label: 'Has blockers' },
  { value: PhaseWatchFollowUpKind.NoStartDate, label: 'No start date' },
  { value: PhaseWatchFollowUpKind.NoTasks, label: 'No tasks' },
]

interface PhaseFollowUpDrawerProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  rows: PhaseWatchProjectRow[]
  filter: string
  onFilterChange: (filter: string) => void
  loading?: boolean
}

export function PhaseFollowUpDrawer({
  open,
  onClose,
  workspaceId,
  rows,
  filter,
  onFilterChange,
  loading,
}: PhaseFollowUpDrawerProps) {
  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Phase Follow-up"
      subtitle="Cross-project current and next phases"
      size="lg"
      footer={
        <Button variant="outline" size="sm" className="rounded-none" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={cn(
                'rounded-none border px-2 py-1 text-xs',
                filter === f.value
                  ? 'border-transparent bg-primary-gradient text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Typography variant="small" tone="muted">
            Loading phases…
          </Typography>
        ) : rows.length === 0 ? (
          <Typography variant="small" tone="muted">
            No projects match this filter.
          </Typography>
        ) : (
          <PhaseWatchTable rows={rows} workspaceId={workspaceId} followUpLabel="Status" />
        )}
      </div>
    </DetailDrawer>
  )
}
