'use client'

import { cn } from '@/utils/cn'
import type { BucketSegmentRatio } from '../../domain/rules/bucket-segment.rules'
import { TIMELINE_SEGMENT } from '../../domain/model/timeline-layout'

type Props = {
  segment: BucketSegmentRatio
  kind: 'phase' | 'task' | 'milestone'
  progressPercent?: number | null
  atRisk?: boolean
  selected?: boolean
  showHandles?: boolean
  onResizeStart?: (edge: 'start' | 'end', e: React.MouseEvent) => void
  metricLabel?: string
}

/**
 * Filled schedule segment inside a time bucket cell (Excel-like).
 * Never render as a 1px line / outline-only bar.
 */
export function ScheduleBucketSegment({
  segment,
  kind: _kind,
  progressPercent,
  atRisk,
  selected,
  showHandles,
  onResizeStart,
  metricLabel,
}: Props) {
  const leftPct = segment.startRatio * 100
  const widthPct = Math.max(
    0,
    (segment.endRatio - segment.startRatio) * 100
  )
  if (widthPct <= 0) return null

  const fill = atRisk ? 'bg-neutral-500' : 'bg-neutral-300'

  return (
    <div
      className={cn(
        'absolute z-[1] box-border rounded-none',
        fill,
        selected && 'ring-2 ring-primary-600 ring-offset-0'
      )}
      style={{
        top: TIMELINE_SEGMENT.VERTICAL_INSET,
        bottom: TIMELINE_SEGMENT.VERTICAL_INSET,
        left: `calc(${leftPct}% + ${TIMELINE_SEGMENT.HORIZONTAL_INSET}px)`,
        width: `calc(${widthPct}% - ${TIMELINE_SEGMENT.HORIZONTAL_INSET * 2}px)`,
        minWidth: TIMELINE_SEGMENT.MIN_WIDTH,
      }}
    >
      {progressPercent != null && progressPercent > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-700/55"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      )}
      {metricLabel ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center truncate px-0.5 text-[10px] font-semibold text-neutral-800">
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
