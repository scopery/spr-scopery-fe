'use client'

import { useRef, useState, type ReactNode } from 'react'
import {
  ChevronDown,
  Redo2,
  Settings2,
  Undo2,
} from 'lucide-react'
import {
  AnchoredMenu,
  anchoredMenuItemClassName,
  Button,
  Stack,
  Typography,
} from '@/shared/ui'
import { cn } from '@/utils/cn'
import { TimelineGranularity, TimelineMetric } from '../../domain/enums/timeline.enum'
import type {
  TimelineGranularity as Granularity,
  TimelineMetric as Metric,
} from '../../domain/enums/timeline.enum'

const TOOLBAR_BTN = 'h-9 min-w-9 px-3 text-[13px] shadow-none'

type Props = {
  granularity: Granularity
  onGranularity: (g: Granularity) => void
  metric: Metric
  onMetric: (m: Metric) => void
  unscheduledCount: number
  canUndo: boolean
  canRedo: boolean
  dirty: boolean
  applying: boolean
  recalculating: boolean
  showCriticalPath: boolean
  hideUnscheduled: boolean
  onToday: () => void
  onFitProject: () => void
  onFitFocusedPhase: (() => void) | null
  onAutoSchedule: () => void
  onUndo: () => void
  onRedo: () => void
  onApply: () => void
  onToggleCriticalPath: () => void
  onToggleHideUnscheduled: () => void
  onCaptureBaseline: () => void
  phaseJumpSlot?: ReactNode
}

function ZoomSegment({
  value,
  onChange,
}: {
  value: Granularity
  onChange: (g: Granularity) => void
}) {
  const options: { value: Granularity; label: string }[] = [
    { value: TimelineGranularity.Day, label: 'Day' },
    { value: TimelineGranularity.Week, label: 'Week' },
    { value: TimelineGranularity.Month, label: 'Month' },
    { value: TimelineGranularity.Quarter, label: 'Quarter' },
  ]
  return (
    <div
      className="inline-flex h-9 shrink-0 items-center gap-0.5 bg-neutral-50 p-0.5"
      role="group"
      aria-label="Zoom"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            'min-w-[4.25rem] px-3 py-1 text-[13px]',
            value === opt.value
              ? 'bg-secondary font-medium text-white'
              : 'font-normal text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const METRIC_OPTIONS = [
  [TimelineMetric.Schedule, 'Schedule'],
  [TimelineMetric.Effort, 'Effort'],
  [TimelineMetric.PlannedPercent, 'Planned Progress'],
  [TimelineMetric.ActualPercent, 'Actual Progress'],
  [TimelineMetric.Variance, 'Variance'],
  [TimelineMetric.Occupancy, 'Occupancy'],
] as const

export function TimelineToolbar({
  granularity,
  onGranularity,
  metric,
  onMetric,
  unscheduledCount,
  canUndo,
  canRedo,
  dirty,
  applying,
  recalculating,
  showCriticalPath,
  hideUnscheduled,
  onToday,
  onFitProject,
  onFitFocusedPhase,
  onAutoSchedule,
  onUndo,
  onRedo,
  onApply,
  onToggleCriticalPath,
  onToggleHideUnscheduled,
  onCaptureBaseline,
  phaseJumpSlot,
}: Props) {
  const [fitOpen, setFitOpen] = useState(false)
  const [cellsOpen, setCellsOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [autoOpen, setAutoOpen] = useState(false)

  const fitRef = useRef<HTMLDivElement>(null)
  const cellsRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<HTMLDivElement>(null)

  const cellLabel =
    METRIC_OPTIONS.find(([v]) => v === metric)?.[1] ?? 'Schedule'

  const autoLabel = 'Auto Schedule'
  const emphasizeAuto = unscheduledCount > 0

  return (
    <Stack direction="vertical" spacing="sm" className="w-full">
      {/*
        Hard rule: never flex-wrap randomly.
        Wide screens: one nowrap row.
        Narrow: horizontal scroll within the row (defined overflow, not wrap).
      */}
      <div className="flex h-9 flex-nowrap items-center gap-3 overflow-x-auto">
        <Button variant="outline" size="md" className={cn(TOOLBAR_BTN, 'shrink-0')} onClick={onToday}>
          Today
        </Button>

        <div ref={fitRef} className="relative shrink-0">
          <Button
            variant="outline"
            size="md"
            className={TOOLBAR_BTN}
            onClick={() => setFitOpen((v) => !v)}
          >
            Fit
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
          <AnchoredMenu open={fitOpen} onClose={() => setFitOpen(false)} anchorRef={fitRef} minWidth={200}>
            <button
              type="button"
              className={anchoredMenuItemClassName}
              onClick={() => {
                setFitOpen(false)
                onFitProject()
              }}
            >
              Fit to scheduled work
            </button>
            {onFitFocusedPhase && (
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  setFitOpen(false)
                  onFitFocusedPhase()
                }}
              >
                Fit to focused phase
              </button>
            )}
            <button
              type="button"
              className={anchoredMenuItemClassName}
              onClick={() => {
                setFitOpen(false)
                onToday()
              }}
            >
              Center on today
            </button>
          </AnchoredMenu>
        </div>

        <div className="shrink-0">{phaseJumpSlot}</div>

        <div className="flex shrink-0 items-center gap-2">
          <Typography variant="caption" tone="muted" className="hidden lg:inline">
            Zoom
          </Typography>
          <ZoomSegment value={granularity} onChange={onGranularity} />
        </div>

        <div ref={cellsRef} className="relative shrink-0">
          <Button
            variant="outline"
            size="md"
            className={cn(TOOLBAR_BTN, 'min-w-[8.5rem] justify-between')}
            onClick={() => setCellsOpen((v) => !v)}
          >
            Display: {cellLabel}
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
          <AnchoredMenu open={cellsOpen} onClose={() => setCellsOpen(false)} anchorRef={cellsRef} minWidth={200}>
            {METRIC_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  onMetric(value)
                  setCellsOpen(false)
                }}
              >
                {label}
                {metric === value ? ' ✓' : ''}
              </button>
            ))}
          </AnchoredMenu>
        </div>

        <div ref={viewRef} className="relative shrink-0">
          <Button
            variant="outline"
            size="md"
            className={cn(TOOLBAR_BTN, 'w-9 px-0')}
            aria-label="View Settings"
            onClick={() => setViewOpen((v) => !v)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <AnchoredMenu open={viewOpen} onClose={() => setViewOpen(false)} anchorRef={viewRef} minWidth={240}>
            <button
              type="button"
              className={anchoredMenuItemClassName}
              onClick={() => {
                onToggleCriticalPath()
                setViewOpen(false)
              }}
            >
              {showCriticalPath ? 'Hide' : 'Show'} Critical Path
            </button>
            <button
              type="button"
              className={anchoredMenuItemClassName}
              onClick={() => {
                onCaptureBaseline()
                setViewOpen(false)
              }}
            >
              Capture Baseline
            </button>
            <button
              type="button"
              className={anchoredMenuItemClassName}
              onClick={() => {
                onToggleHideUnscheduled()
                setViewOpen(false)
              }}
            >
              {hideUnscheduled ? 'Show' : 'Hide'} Unscheduled Tasks
            </button>
          </AnchoredMenu>
        </div>

        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2">
          <div ref={autoRef} className="relative">
            <Button
              variant={emphasizeAuto ? 'primary' : 'outline'}
              size="md"
              className={TOOLBAR_BTN}
              loading={recalculating}
              onClick={() => setAutoOpen((v) => !v)}
            >
              <span className="hidden min-[1280px]:inline">{autoLabel}</span>
              <span className="min-[1280px]:hidden">Auto Schedule</span>
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
            <AnchoredMenu open={autoOpen} onClose={() => setAutoOpen(false)} anchorRef={autoRef} minWidth={280}>
              <div className="border-b border-neutral-100 px-3 py-2">
                <Typography variant="caption" tone="muted" className="leading-snug">
                  Recomputes project task dates from estimates and dependencies
                  within the visible planning window. Manual drag overrides stay
                  until you clear them.
                </Typography>
              </div>
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  setAutoOpen(false)
                  onAutoSchedule()
                }}
              >
                Run auto schedule
              </button>
            </AnchoredMenu>
          </div>

          <Button
            variant="outline"
            size="md"
            className={cn(TOOLBAR_BTN, 'w-9 px-0')}
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="md"
            className={cn(TOOLBAR_BTN, 'w-9 px-0')}
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          {dirty && (
            <Button
              variant="primary"
              size="md"
              className={TOOLBAR_BTN}
              loading={applying}
              onClick={onApply}
            >
              Apply Changes
            </Button>
          )}
        </div>
      </div>
    </Stack>
  )
}
