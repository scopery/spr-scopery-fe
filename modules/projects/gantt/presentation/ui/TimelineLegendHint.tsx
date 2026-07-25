'use client'

import { CircleHelp } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

const LEGEND_ITEMS = [
  {
    swatch: 'bg-sky-300',
    title: 'Task',
    note: 'Drag the bar or double-click to edit dates.',
  },
  {
    swatch: 'bg-slate-300',
    title: 'Phase / WBS',
    note: 'Drag to shift all child tasks together.',
  },
  {
    swatch: 'bg-amber-200',
    title: 'Unscheduled',
    note: 'Placeholder only — no real dates yet.',
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
                className={cn('mt-1 inline-block h-2.5 w-6 shrink-0', item.swatch)}
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
