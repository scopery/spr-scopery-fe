'use client'

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { TimelineFlatRow } from '../../domain/model/timeline'
import {
  formatTimelineCompactRange,
  formatTimelineShortDate,
} from '../../domain/rules/phase-display.rules'
import { phaseHealthLabel } from '../../domain/rules/phase-row-summary.rules'

type Props = {
  phase: TimelineFlatRow
  delayMs?: number
  children: (handlers: {
    onMouseEnter: (e: MouseEvent) => void
    onMouseLeave: () => void
  }) => ReactNode
}

export function PhaseRichTooltip({ phase, delayMs = 400, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const onMouseEnter = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setPos({ x: clientX + 12, y: clientY + 12 })
      setOpen(true)
    }, delayMs)
  }

  const onMouseLeave = () => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
    setPos(null)
  }

  const summary = phase.phaseSummary
  const health = summary ? phaseHealthLabel(summary) : null

  return (
    <>
      {children({ onMouseEnter, onMouseLeave })}
      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[80] max-w-xs border border-neutral-200 bg-white px-md py-sm text-xs shadow-md"
            style={{ left: pos.x, top: pos.y }}
            role="tooltip"
          >
            <div className="font-medium text-neutral-900">{phase.displayPrimary}</div>
            {phase.displaySecondary && (
              <div className="mt-0.5 text-neutral-500">{phase.displaySecondary}</div>
            )}
            <div className="mt-sm text-neutral-700">
              {phase.startDate && phase.endDate
                ? `${formatTimelineShortDate(phase.startDate)} → ${formatTimelineShortDate(phase.endDate)}`
                : formatTimelineCompactRange(phase.startDate, phase.endDate) || 'No dates'}
            </div>
            {summary && (
              <div className="mt-xs text-neutral-600">
                {summary.taskCount} tasks ·{' '}
                {summary.progressPercent != null
                  ? `${summary.progressPercent}% complete`
                  : 'no progress'}
              </div>
            )}
            {summary && (summary.unscheduledCount > 0 || summary.atRiskCount > 0) && (
              <div className="mt-xs text-neutral-600">
                {summary.unscheduledCount > 0
                  ? `${summary.unscheduledCount} unscheduled`
                  : null}
                {summary.unscheduledCount > 0 && summary.atRiskCount > 0 ? ' · ' : null}
                {summary.atRiskCount > 0 ? `${summary.atRiskCount} at risk` : null}
                {health ? ` · ${health}` : null}
              </div>
            )}
            <div className="mt-sm text-neutral-400">Click to view Phase details</div>
          </div>,
          document.body
        )}
    </>
  )
}
