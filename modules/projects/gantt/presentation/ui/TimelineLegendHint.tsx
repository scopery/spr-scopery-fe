'use client'

import { CircleHelp } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  TIMELINE_BAR_COLORS,
  TIMELINE_PHASE_HATCH_BACKGROUND,
} from '../../domain/model/timeline-bar-colors'

const LEGEND_ITEMS = [
  {
    background: TIMELINE_BAR_COLORS.project,
    title: 'Project',
    note: 'Root span — double-click or calendar icon to edit dates.',
  },
  {
    background: TIMELINE_PHASE_HATCH_BACKGROUND,
    title: 'Phase',
    note: 'Drag edges to resize, or edit dates from the calendar icon.',
  },
  {
    background: TIMELINE_BAR_COLORS.wbs,
    title: 'Work package',
    note: 'Package bar under a phase.',
  },
  {
    background: TIMELINE_BAR_COLORS.wbsTaskGroup,
    title: 'Task group',
    note: 'Group of tasks under a phase.',
  },
  {
    background: TIMELINE_BAR_COLORS.milestone,
    title: 'Planning Element · Milestone',
    note: 'WBS node typed as Milestone.',
  },
  {
    background: TIMELINE_BAR_COLORS.task,
    title: 'Task',
    note: 'Drag the bar or paint cells to schedule.',
  },
  {
    background: TIMELINE_BAR_COLORS.taskUnassigned,
    title: 'Unassigned task',
    note: 'Scheduled but no person assigned yet.',
  },
] as const

export function TimelineLegendHint({ className }: { className?: string }) {
  return (
    <div className={cn('group relative inline-flex items-center', className)}>
      <button
        type="button"
        aria-label="Timeline legend"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center',
          'text-neutral-500 transition-colors hover:text-neutral-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
        )}
      >
        <CircleHelp size={18} strokeWidth={1.75} aria-hidden />
      </button>

      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute right-0 top-full z-30 mt-2 w-64',
          'border border-neutral-200 bg-white p-3 shadow-md',
          'opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100'
        )}
      >
        <Typography weight="medium" size="sm" className="mb-2">
          Legend
        </Typography>
        <ul className="space-y-2.5">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.title} className="flex gap-2.5">
              <span
                className="mt-1 inline-block h-2.5 w-6 shrink-0 border border-neutral-300"
                style={{ background: item.background }}
                aria-hidden
              />
              <div className="min-w-0">
                <Typography size="sm" weight="medium">
                  {item.title}
                </Typography>
                <Typography variant="small" tone="muted" className="mt-0.5">
                  {item.note}
                </Typography>
              </div>
            </li>
          ))}
        </ul>
        <Typography variant="small" tone="muted" className="mt-3 border-t border-neutral-100 pt-2">
          Recalculate reschedules dependencies project-wide.
        </Typography>
      </div>
    </div>
  )
}
