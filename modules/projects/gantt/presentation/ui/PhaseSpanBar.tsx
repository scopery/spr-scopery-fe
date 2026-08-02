'use client'

import { cn } from '@/utils/cn'
import type { TimelineColumn } from '../../domain/model/timeline'

type Props = {
  columns: TimelineColumn[]
  colWidth: number
  rowHeight: number
  startDate: string | null
  endDate: string | null
  label: string
  progressPercent: number | null
  atRisk?: boolean
}

function spanIndices(
  columns: TimelineColumn[],
  startDate: string,
  endDate: string
): { start: number; end: number } | null {
  let start = -1
  let end = -1
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]
    if (!col) continue
    const overlaps = col.periodStart <= endDate && col.periodEnd >= startDate
    if (overlaps) {
      if (start < 0) start = i
      end = i
    }
  }
  if (start < 0 || end < 0) return null
  return { start, end }
}

/**
 * Phase span bar with label inside (wide) or to the right (narrow).
 */
export function PhaseSpanBar({
  columns,
  colWidth,
  rowHeight,
  startDate,
  endDate,
  label,
  progressPercent,
  atRisk,
}: Props) {
  if (!startDate || !endDate) return null
  const span = spanIndices(columns, startDate, endDate)
  if (!span) return null

  const left = span.start * colWidth
  const width = (span.end - span.start + 1) * colWidth
  const progress =
    progressPercent != null ? `${Math.round(progressPercent)}%` : null
  const text = progress ? `${label} · ${progress}` : label
  const barH = Math.max(14, Math.min(22, rowHeight - 20))
  const top = Math.round((rowHeight - barH) / 2)

  const showInside = width >= 120
  const showBeside = width >= 24 && width < 120
  const markerOnly = width < 24

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      <div
        className={cn(
          'absolute border border-primary-700 bg-primary-400',
          atRisk && 'border-error-700 bg-error-400'
        )}
        style={{ left, width: Math.max(width, 4), top, height: barH }}
      />
      {showInside && (
        <div
          className="absolute truncate px-1 text-[11px] font-semibold leading-none text-white"
          style={{
            left: left + 4,
            width: width - 8,
            top: top + (barH - 11) / 2,
          }}
          title={text}
        >
          {text}
        </div>
      )}
      {showBeside && (
        <div
          className="absolute truncate text-[11px] font-semibold text-neutral-800"
          style={{
            left: left + width + 6,
            top: top + (barH - 11) / 2,
            maxWidth: 220,
          }}
          title={text}
        >
          {text}
        </div>
      )}
      {markerOnly && (
        <div
          className="absolute h-2.5 w-2.5 bg-primary-700"
          style={{ left: left + 1, top: top + (barH - 10) / 2 }}
          title={text}
        />
      )}
    </div>
  )
}
