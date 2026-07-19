'use client'

import { cn } from '@/utils/cn'
import { Typography } from '@/shared/ui'
import { computeBarStyle, ganttItemBarTone, ganttItemTypeLabel } from '../../domain/rules/gantt.rules'
import type { GanttDateRange } from '../../domain/rules/gantt.rules'
import type { GanttTreeItem } from '../../domain/model/gantt'

const BAR_TONE_CLASS: Record<'primary' | 'neutral' | 'warning', string> = {
  primary: 'bg-primary',
  neutral: 'bg-neutral-300',
  warning: 'bg-amber-500',
}

interface GanttBarRowProps {
  item: GanttTreeItem
  depth: number
  range: GanttDateRange
}

function GanttBar({ item, range }: { item: GanttTreeItem; range: GanttDateRange }) {
  const style = computeBarStyle(item, range)
  if (!style) {
    return <Typography variant="small" tone="muted">Unscheduled</Typography>
  }

  const tone = ganttItemBarTone(item)

  if (item.zeroDuration) {
    return (
      <div className="relative h-6 w-full">
        <div
          className={cn('absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45', BAR_TONE_CLASS[tone])}
          style={{ left: `${style.leftPercent}%` }}
          title={`${item.title} · ${item.startDate ?? ''}`}
        />
      </div>
    )
  }

  return (
    <div className="relative h-6 w-full">
      <div
        className={cn('absolute top-1/2 h-3 -translate-y-1/2 rounded-sm', BAR_TONE_CLASS[tone])}
        style={{ left: `${style.leftPercent}%`, width: `${style.widthPercent}%` }}
        title={`${item.title} · ${item.startDate ?? '—'} → ${item.endDate ?? '—'}`}
      />
    </div>
  )
}

export function GanttBarRow({ item, depth, range }: GanttBarRowProps) {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,280px)_1fr] items-center gap-3 border-t border-neutral-100 px-4 py-2">
        <div className="flex items-center gap-2 overflow-hidden" style={{ paddingLeft: depth * 16 }}>
          <Typography as="span" weight="medium" truncate>
            {item.title}
          </Typography>
          <Typography as="span" size="xs" tone="muted" className="shrink-0">
            {ganttItemTypeLabel(item.itemType)}
          </Typography>
        </div>
        <GanttBar item={item} range={range} />
      </div>
      {item.children.map((child) => (
        <GanttBarRow key={child.id} item={child} depth={depth + 1} range={range} />
      ))}
    </>
  )
}
