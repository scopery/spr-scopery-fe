'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/utils/cn'
import type { BucketSegmentRatio } from '../../domain/rules/bucket-segment.rules'
import {
  TIMELINE_BAR_COLORS,
  TIMELINE_PHASE_HATCH_IMAGE,
} from '../../domain/model/timeline-bar-colors'
import { TIMELINE_SEGMENT } from '../../domain/model/timeline-layout'

export type ScheduleFillKind =
  | 'project'
  | 'phase'
  | 'wbs'
  | 'wbsMilestone'
  | 'task'
  | 'milestone'

type Props = {
  segment: BucketSegmentRatio
  kind: ScheduleFillKind
  atRisk?: boolean
  /** Task with no assignee — light red so gaps stand out. */
  unassigned?: boolean
  selected?: boolean
  /** 0–100 progress overlay (Schedule display). */
  progressPercent?: number | null
  /** Numeric overlay for Effort / Planned / Actual / Variance / Occupancy. */
  metricLabel?: string
  showHandles?: boolean
  onResizeStart?: (edge: 'start' | 'end', e: React.MouseEvent) => void
}

function fillStyle(
  kind: ScheduleFillKind,
  atRisk?: boolean,
  unassigned?: boolean
): CSSProperties {
  if (atRisk) return {}
  if (kind === 'task' && unassigned) {
    return { backgroundColor: TIMELINE_BAR_COLORS.taskUnassigned }
  }
  if (kind === 'phase') {
    return {
      backgroundColor: TIMELINE_BAR_COLORS.phase,
      backgroundImage: TIMELINE_PHASE_HATCH_IMAGE,
    }
  }
  switch (kind) {
    case 'project':
      return { backgroundImage: TIMELINE_BAR_COLORS.project }
    case 'wbs':
      return { backgroundColor: TIMELINE_BAR_COLORS.wbs }
    case 'wbsMilestone':
    case 'milestone':
      return { backgroundColor: TIMELINE_BAR_COLORS.milestone }
    case 'task':
    default:
      return { backgroundColor: TIMELINE_BAR_COLORS.task }
  }
}

/**
 * Filled schedule segment inside a time bucket cell (Excel-like).
 * Never render as a 1px line / outline-only bar.
 */
export function ScheduleBucketSegment({
  segment,
  kind,
  atRisk,
  unassigned,
  selected,
  progressPercent,
  metricLabel,
  showHandles,
  onResizeStart,
}: Props) {
  const leftPct = segment.startRatio * 100
  const widthPct = Math.max(
    0,
    (segment.endRatio - segment.startRatio) * 100
  )
  if (widthPct <= 0) return null

  const fill = fillStyle(kind, atRisk, unassigned)

  return (
    <div
      className={cn(
        'absolute z-[1] box-border rounded-none overflow-hidden border',
        atRisk
          ? 'border-neutral-800 bg-neutral-700'
          : 'border-neutral-300',
        selected && 'ring-2 ring-primary-600 ring-offset-0'
      )}
      style={{
        top: TIMELINE_SEGMENT.VERTICAL_INSET,
        bottom: TIMELINE_SEGMENT.VERTICAL_INSET,
        left: `calc(${leftPct}% + ${TIMELINE_SEGMENT.HORIZONTAL_INSET}px)`,
        width: `calc(${widthPct}% - ${TIMELINE_SEGMENT.HORIZONTAL_INSET * 2}px)`,
        minWidth: TIMELINE_SEGMENT.MIN_WIDTH,
        ...fill,
      }}
    >
      {progressPercent != null && progressPercent > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-900/25"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      )}
      {metricLabel ? (
        <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center truncate px-0.5 text-[10px] font-semibold text-neutral-900">
          {metricLabel}
        </span>
      ) : null}
      {showHandles && segment.isFirst && (
        <button
          type="button"
          aria-label="Resize start"
          className="absolute inset-y-0 left-0 z-[2] w-1.5 cursor-ew-resize bg-white/80 opacity-0 hover:opacity-100 group-hover:opacity-100"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onResizeStart?.('start', e)
          }}
        />
      )}
      {showHandles && segment.isLast && (
        <button
          type="button"
          aria-label="Resize end"
          className="absolute inset-y-0 right-0 z-[2] w-1.5 cursor-ew-resize bg-white/80 opacity-0 hover:opacity-100 group-hover:opacity-100"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onResizeStart?.('end', e)
          }}
        />
      )}
    </div>
  )
}

export function scheduleFillKindForRow(row: {
  kind: string
  itemType: string
  wbsNodeType?: string | null
}): ScheduleFillKind {
  if (row.itemType === 'PROJECT') return 'project'
  if (row.itemType === 'PHASE') return 'phase'
  if (row.itemType === 'WBS_NODE') {
    const t = (row.wbsNodeType || '').toUpperCase()
    // Legacy DELIVERABLE rows map to the same milestone visual.
    return t === 'MILESTONE' || t === 'DELIVERABLE' ? 'wbsMilestone' : 'wbs'
  }
  if (row.kind === 'milestone') return 'milestone'
  return 'task'
}
