'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Check, ChevronDown, ChevronRight, ExternalLink, Settings2 } from 'lucide-react'
import {
  AnchoredMenu,
  anchoredMenuItemClassName,
  Badge,
  Button,
  Checkbox,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { useWorkspaceMemberPeople } from '@/modules/org/workspace'
import { useQuickAssignTasks } from '@/modules/org/workspace/hooks/useQuickAssignTasks'
import { UserSearchSelect, useResolveUsers } from '@/modules/platform'
import {
  DEFAULT_DAY_CAPACITY_MINUTES,
  ScheduleBucketSegment,
  TIMELINE_BOARD_LAYOUT,
  TIMELINE_LEFT_COLS,
  TimelineCollapseModeButton,
  TimelineGranularity,
  TimelineMetric,
  buildBucketsForRow,
  computeBarPixelRange,
  formatEstimateHours,
  formatTimelineCompactRange,
  formatTimelineMetricLabel,
  sumPlannedMinutesByColumn,
  timelineBoardCanvasStyle,
  timelineBoardContentStyle,
  timelineBoardLeftPaneStyle,
  timelineBoardRightPaneStyle,
  timelineRowHeight,
  useTimelineBoardScroll,
  type ScheduleFillKind,
  type TimelineFlatRow,
  type TimelineMetricType,
} from '@/modules/projects/gantt'
import { useResourceTimeline } from '../hooks/useResourceTimeline'
import { downloadTeamScheduleExcel } from '../exportTeamScheduleExcel'
import { ProjectMultiSelect } from './ProjectMultiSelect'
import {
  RESOURCE_TIMELINE_DEFAULT_PROJECTS,
  RESOURCE_TIMELINE_MAX_PROJECTS,
  defaultSelectedProjectIds,
} from '../../domain/rules/resource-timeline.rules'
import {
  AssignTaskConfirmModal,
  type AssignTaskConfirmTarget,
} from './AssignTaskConfirmModal'

const HEADER_H = 54
const HEADER_H_DAY_LOAD = 64
const CONTROL_H = 'h-9'
const ROW_HOVER = 'bg-sky-50/70'
const ROW_FOCUS = 'bg-sky-100/90 ring-1 ring-inset ring-sky-300'
const DAY_CAPACITY_HOURS = DEFAULT_DAY_CAPACITY_MINUTES / 60

function findColumnIndexForDate(
  columns: { periodStart: string; periodEnd: string }[],
  date: string
): number {
  const day = date.slice(0, 10)
  return columns.findIndex((c) => day >= c.periodStart && day <= c.periodEnd)
}

function formatDayLoadHours(hours: number): string {
  if (hours <= 0) return '0h'
  const rounded = Math.round(hours * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`
}
const TODAY_COL = 'bg-sky-50 !border-l !border-r !border-l-sky-300 !border-r-sky-300'
const MONTH_BOUNDARY = 'border-l border-l-neutral-400'

const ZOOM_OPTIONS = [
  { value: TimelineGranularity.Day, label: 'Day' },
  { value: TimelineGranularity.Week, label: 'Week' },
  { value: TimelineGranularity.Month, label: 'Month' },
  { value: TimelineGranularity.Quarter, label: 'Quarter' },
]

const METRIC_OPTIONS: { value: TimelineMetricType; label: string }[] = [
  { value: TimelineMetric.Schedule, label: 'Schedule' },
  { value: TimelineMetric.Effort, label: 'Effort' },
  { value: TimelineMetric.PlannedPercent, label: 'Planned Progress' },
  { value: TimelineMetric.ActualPercent, label: 'Actual Progress' },
  { value: TimelineMetric.Variance, label: 'Variance' },
  { value: TimelineMetric.Occupancy, label: 'Occupancy' },
]

function scheduleFillKindForRow(row: TimelineFlatRow): ScheduleFillKind {
  if (row.itemType === 'PROJECT') return 'project'
  if (row.itemType === 'PHASE') return 'phase'
  if (row.itemType === 'WBS_NODE') {
    return row.wbsNodeType === 'MILESTONE' ? 'wbsMilestone' : 'wbs'
  }
  if (row.kind === 'milestone') return 'milestone'
  return 'task'
}

function rowHeight(row: TimelineFlatRow): number {
  if (row.kind === 'milestone') return timelineRowHeight('milestone')
  if (row.kind === 'task') return timelineRowHeight('task')
  return timelineRowHeight('phase', row.itemType)
}

function taskMetaLine(row: TimelineFlatRow): string | null {
  if (row.kind !== 'task' && row.kind !== 'milestone') {
    if (row.kind === 'phase' && row.startDate && row.endDate) {
      return formatTimelineCompactRange(row.startDate, row.endDate) || null
    }
    return null
  }
  const bits: string[] = []
  if (row.displaySecondary) bits.push(row.displaySecondary)
  if (row.startDate && row.endDate) {
    const range = formatTimelineCompactRange(row.startDate, row.endDate)
    if (range) bits.push(range)
  } else if (!row.startDate) {
    bits.push('Unscheduled')
  }
  const est = formatEstimateHours(row.estimateHours)
  if (est) bits.push(est)
  return bits.length ? bits.join(' · ') : null
}

export function ResourceTimelineView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [includeUnassigned, setIncludeUnassigned] = useState(true)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [projectsHydrated, setProjectsHydrated] = useState(false)
  const [metric, setMetric] = useState<TimelineMetricType>(TimelineMetric.Schedule)
  const [viewOpen, setViewOpen] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [hoverRowId, setHoverRowId] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<AssignTaskConfirmTarget | null>(
    null
  )
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const focusClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingScrollToDateRef = useRef<string | null>(null)

  const { people, loading: membersLoading } = useWorkspaceMemberPeople(workspaceId)
  const seedIds = useMemo(() => people.map((p) => p.id), [people])
  const { labelFor } = useResolveUsers(seedIds)

  const tl = useResourceTimeline(workspaceId, {
    selectedUserId: selectedUserId || null,
    includeUnassigned,
    selectedProjectIds,
  })

  // Default: newest 10 watchable projects once the catalog loads.
  useEffect(() => {
    if (projectsHydrated) return
    if (tl.projectsLoading) return
    if (tl.watchableProjects.length === 0) {
      setProjectsHydrated(true)
      return
    }
    setSelectedProjectIds(
      defaultSelectedProjectIds(tl.watchableProjects, RESOURCE_TIMELINE_DEFAULT_PROJECTS)
    )
    setProjectsHydrated(true)
  }, [projectsHydrated, tl.projectsLoading, tl.watchableProjects])

  // Drop stale ids if a project leaves the watchable set.
  useEffect(() => {
    if (!projectsHydrated) return
    const watchableIds = new Set(tl.watchableProjects.map((p) => p.id))
    setSelectedProjectIds((prev) => {
      const next = prev.filter((id) => watchableIds.has(id))
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev
      }
      return next
    })
  }, [projectsHydrated, tl.watchableProjects])

  const { assignTasks, submitting } = useQuickAssignTasks(tl.refetch)

  const scrollingRef = useRef(false)
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingScrollToTodayRef = useRef(false)

  const leftWidth =
    TIMELINE_LEFT_COLS.CHECKBOX + TIMELINE_LEFT_COLS.ITEM + TIMELINE_LEFT_COLS.STATUS
  const canvasWidth = Math.max(tl.columns.length * tl.colWidth, 1)
  // Include assignee + day-load header so wheel/layout rebind after those UI mode switches.
  const boardLayoutKey = `${tl.granularity}:${canvasWidth}:${tl.columns.length}:${selectedUserId || 'all'}:${metric}`
  const FULL_BAR_SEGMENT = {
    startRatio: 0,
    endRatio: 1,
    isFirst: true,
    isLast: true,
  } as const

  const markScrolling = useCallback(() => {
    scrollingRef.current = true
    // Drop hover while scrolling to avoid re-rendering every row mid-gesture.
    setHoverRowId((prev) => (prev == null ? prev : null))
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current)
    scrollIdleTimerRef.current = setTimeout(() => {
      scrollingRef.current = false
    }, 120)
  }, [])

  const setHoverRowSafe = useCallback((id: string | null) => {
    if (scrollingRef.current) return
    setHoverRowId(id)
  }, [])

  const {
    leftScrollRef,
    canvasScrollRef,
    canvasHeaderScrollRef,
    syncScroll,
    scrollCanvasToColumnIndex: scrollToColumn,
    onCanvasPanMouseDown,
  } = useTimelineBoardScroll({
    enabled: tl.hasData,
    layoutKey: boardLayoutKey,
    onScrollActivity: markScrolling,
  })

  const scrollCanvasToColumnIndex = useCallback(
    (columnIndex: number) => scrollToColumn(columnIndex, tl.colWidth),
    [scrollToColumn, tl.colWidth]
  )

  const scrollCanvasToTodayColumn = useCallback(() => {
    const todayIndex = tl.columns.findIndex((c) => c.isToday)
    return scrollCanvasToColumnIndex(todayIndex)
  }, [tl.columns, scrollCanvasToColumnIndex])

  const scrollCanvasToDateColumn = useCallback(
    (date: string) => {
      const index = findColumnIndexForDate(tl.columns, date)
      return scrollCanvasToColumnIndex(index)
    },
    [tl.columns, scrollCanvasToColumnIndex]
  )

  const handleToday = useCallback(() => {
    pendingScrollToTodayRef.current = true
    tl.goToday()
    requestAnimationFrame(() => {
      if (scrollCanvasToTodayColumn()) pendingScrollToTodayRef.current = false
    })
  }, [tl.goToday, scrollCanvasToTodayColumn])

  const handleExportExcel = useCallback(async () => {
    if (!tl.hasData || exportingExcel) return
    setExportingExcel(true)
    try {
      await downloadTeamScheduleExcel(tl.rows, {
        personLabelFor: labelFor,
        projectNameForTask: tl.projectNameForTask,
        fileName: selectedUserId
          ? `team-schedule-${labelFor(selectedUserId)}`
          : 'team-schedule',
      })
    } finally {
      setExportingExcel(false)
    }
  }, [
    exportingExcel,
    labelFor,
    selectedUserId,
    tl.hasData,
    tl.projectNameForTask,
    tl.rows,
  ])

  useEffect(() => {
    if (!pendingScrollToTodayRef.current) return
    if (scrollCanvasToTodayColumn()) pendingScrollToTodayRef.current = false
  }, [tl.columns, scrollCanvasToTodayColumn])

  useEffect(() => {
    const date = pendingScrollToDateRef.current
    if (!date) return
    if (scrollCanvasToDateColumn(date)) pendingScrollToDateRef.current = null
  }, [tl.columns, scrollCanvasToDateColumn])

  const markFocusedRow = useCallback((rowId: string) => {
    setFocusedRowId(rowId)
    if (focusClearTimerRef.current) clearTimeout(focusClearTimerRef.current)
    focusClearTimerRef.current = setTimeout(() => {
      setFocusedRowId((prev) => (prev === rowId ? null : prev))
    }, 2500)
  }, [])

  useEffect(() => {
    return () => {
      if (focusClearTimerRef.current) clearTimeout(focusClearTimerRef.current)
    }
  }, [])

  /** Click a task/milestone → scroll timeline to its start column (day/week/month). */
  const focusTimelineRow = useCallback(
    (row: TimelineFlatRow) => {
      if (row.kind !== 'task' && row.kind !== 'milestone') return
      markFocusedRow(row.id)
      const focusDate = row.startDate ?? row.endDate
      if (!focusDate) return
      pendingScrollToDateRef.current = focusDate
      tl.ensureDateVisible(focusDate)
      requestAnimationFrame(() => {
        if (scrollCanvasToDateColumn(focusDate)) {
          pendingScrollToDateRef.current = null
        }
      })
    },
    [markFocusedRow, scrollCanvasToDateColumn, tl.ensureDateVisible]
  )

  const openAssignModal = useCallback(
    (row: TimelineFlatRow) => {
      if (!row.sourceEntityId) return
      const projectId = tl.projectIdForTask(row.sourceEntityId)
      if (!projectId) return
      setAssignTarget({
        row,
        projectId,
        projectName: tl.projectNameForTask(row.sourceEntityId),
      })
    },
    [tl.projectIdForTask, tl.projectNameForTask]
  )

  const closeAssignModal = useCallback(() => {
    if (submitting) return
    setAssignTarget(null)
  }, [submitting])

  const confirmAssign = useCallback(
    (assigneeUserId: string) => {
      if (!assignTarget?.row.sourceEntityId) return
      void assignTasks(
        [
          {
            projectId: assignTarget.projectId,
            taskId: assignTarget.row.sourceEntityId,
          },
        ],
        assigneeUserId
      ).then((result) => {
        if (result.assigned > 0) setAssignTarget(null)
      })
    },
    [assignTarget, assignTasks]
  )

  // Day load / capacity only makes sense for one person — hide in "all people" view.
  const showDayLoad =
    Boolean(selectedUserId) && tl.granularity === TimelineGranularity.Day
  const headerH = showDayLoad ? HEADER_H_DAY_LOAD : HEADER_H
  // Buckets are O(rows × columns) — only for metric overlays, never for day-load alone.
  const needBuckets = metric !== TimelineMetric.Schedule

  /**
   * Buckets are O(rows × columns) — lethal in Day zoom.
   * Skip when Schedule bars alone are enough.
   */
  const bucketsByRowId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildBucketsForRow>>()
    if (!needBuckets) return map
    for (const row of tl.rows) {
      if (row.kind !== 'task' && row.kind !== 'milestone') continue
      map.set(
        row.id,
        buildBucketsForRow(
          tl.columns,
          row.startDate,
          row.endDate,
          row.estimateHours,
          { taskId: row.sourceEntityId }
        )
      )
    }
    return map
  }, [needBuckets, tl.rows, tl.columns])

  /** One pixel bar per scheduled row — avoids O(rows × columns) Day cells (breaks H-scroll). */
  const barRangeByRowId = useMemo(() => {
    const map = new Map<string, { left: number; width: number }>()
    for (const row of tl.rows) {
      if (!row.startDate || !row.endDate) continue
      const range = computeBarPixelRange(
        row.startDate,
        row.endDate,
        tl.columns,
        tl.colWidth
      )
      if (!range) continue
      map.set(row.id, {
        left: range.left,
        width: Math.max(range.right - range.left, 8),
      })
    }
    return map
  }, [tl.rows, tl.columns, tl.colWidth])

  const canvasBodyHeight = useMemo(
    () => tl.rows.reduce((sum, row) => sum + rowHeight(row), 0),
    [tl.rows]
  )

  const todayColIndex = useMemo(
    () => tl.columns.findIndex((c) => c.isToday),
    [tl.columns]
  )

  /** Merge consecutive weekend columns into ranges — fewer absolute overlays in Day zoom. */
  const weekendRanges = useMemo(() => {
    const ranges: { start: number; count: number }[] = []
    let start = -1
    let count = 0
    tl.columns.forEach((col, i) => {
      const isWe = col.isWeekend && !col.isToday
      if (isWe) {
        if (start < 0) start = i
        count += 1
      } else if (start >= 0) {
        ranges.push({ start, count })
        start = -1
        count = 0
      }
    })
    if (start >= 0) ranges.push({ start, count })
    return ranges
  }, [tl.columns])

  /** Day totals for the selected person only — never include unassigned leaves. */
  const dayLoadHours = useMemo(() => {
    if (!showDayLoad || tl.columns.length === 0) return null
    const items = tl.rows
      .filter(
        (row) =>
          (row.kind === 'task' || row.kind === 'milestone') &&
          Boolean(row.assigneeUserId)
      )
      .map((row) => ({
        startDate: row.startDate,
        endDate: row.endDate,
        estimateHours: row.estimateHours,
      }))
    return sumPlannedMinutesByColumn(tl.columns, items).map((m) => m / 60)
  }, [showDayLoad, tl.columns, tl.rows])

  const canvasGridStyle = useMemo(() => {
    const line = 'rgb(229 229 229)' // neutral-200
    const w = tl.colWidth
    return {
      width: canvasWidth,
      minWidth: canvasWidth,
      height: Math.max(canvasBodyHeight, 1),
      backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${w - 1}px, ${line} ${w - 1}px, ${line} ${w}px)`,
    } as const
  }, [canvasWidth, canvasBodyHeight, tl.colWidth])

  if (membersLoading && people.length === 0) {
    return <PageSkeleton variant="cards" />
  }

  const metricLabel = METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? 'Schedule'

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <Typography as="h1" size="md" weight="medium">
            Team schedule
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Cross-project timeline for the whole team. Optionally filter to one person.
          </Typography>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <div className={cn('min-w-[200px] max-w-[280px] flex-1', CONTROL_H)}>
            <ProjectMultiSelect
              options={tl.watchableProjects.map((p) => ({
                id: p.id,
                name: p.name,
                code: p.code,
              }))}
              value={selectedProjectIds}
              onChange={setSelectedProjectIds}
              max={RESOURCE_TIMELINE_MAX_PROJECTS}
              disabled={tl.projectsLoading}
            />
          </div>
          <div className={cn('min-w-[260px] max-w-[320px] flex-1', CONTROL_H)}>
            <UserSearchSelect
              value={selectedUserId}
              onChange={(userId) => setSelectedUserId(userId)}
              placeholder="All people · filter…"
              seedPeople={people}
              allowRemoteSearch={false}
            />
          </div>
          <div className={cn('w-[140px] shrink-0', CONTROL_H)}>
            <Select
              size="md"
              value={tl.granularity}
              onValueChange={(v: string) =>
                tl.setGranularity(v as (typeof ZOOM_OPTIONS)[number]['value'])
              }
              options={[...ZOOM_OPTIONS]}
              placeholder="Zoom"
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            className={cn(CONTROL_H, 'shrink-0')}
            onClick={handleToday}
            disabled={!tl.hasData}
          >
            Today
          </Button>
          <div ref={viewRef} className="relative ml-1 shrink-0">
            <Button
              variant="outline"
              size="md"
              className={cn(CONTROL_H, 'w-9 px-0')}
              aria-label="Display settings"
              aria-expanded={viewOpen}
              title={`Display · ${metricLabel}`}
              onClick={() => setViewOpen((v) => !v)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <AnchoredMenu
              open={viewOpen}
              onClose={() => setViewOpen(false)}
              anchorRef={viewRef}
              minWidth={260}
            >
              <div className="border-b border-neutral-100 px-3 py-2">
                <Checkbox
                  label="Display unassigned"
                  checked={includeUnassigned}
                  onChange={(e) => setIncludeUnassigned(e.target.checked)}
                />
              </div>
              <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                Display mode
              </div>
              {METRIC_OPTIONS.map((opt) => {
                const selected = metric === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      anchoredMenuItemClassName,
                      'flex w-full items-center justify-between gap-2',
                      selected && 'bg-neutral-100 font-medium'
                    )}
                    onClick={() => {
                      setMetric(opt.value)
                      setViewOpen(false)
                    }}
                  >
                    <span>{opt.label}</span>
                    {selected ? (
                      <Check className="h-4 w-4 shrink-0 text-neutral-800" aria-hidden />
                    ) : (
                      <span className="inline-block h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </button>
                )
              })}
              <div className="border-t border-neutral-100" />
              <button
                type="button"
                className={cn(
                  anchoredMenuItemClassName,
                  (!tl.hasData || exportingExcel) && 'opacity-50'
                )}
                disabled={!tl.hasData || exportingExcel}
                onClick={() => {
                  if (!tl.hasData || exportingExcel) return
                  setViewOpen(false)
                  void handleExportExcel()
                }}
              >
                {exportingExcel ? 'Exporting…' : 'Export to Excel'}
              </button>
            </AnchoredMenu>
          </div>
        </div>
      </div>

      {tl.projectCapReached ? (
        <Typography variant="small" tone="muted" className="mb-2 px-1">
          Up to {tl.maxProjects} projects at once (fan-out cap). Showing {tl.projectCount}{' '}
          selected.
        </Typography>
      ) : null}

      {tl.loading ? (
        <PageSkeleton variant="cards" />
      ) : tl.error ? (
        <div className="border border-error/30 bg-error/5 p-4">
          <Typography variant="small" tone="error">
            {tl.error}
          </Typography>
        </div>
      ) : selectedProjectIds.length === 0 && projectsHydrated ? (
        <div className="flex flex-1 items-center justify-center border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16">
          <Typography tone="muted">Select at least one project.</Typography>
        </div>
      ) : selectedProjectIds.length === 0 ? (
        <PageSkeleton variant="cards" />
      ) : !tl.hasData ? (
        <div className="flex flex-1 items-center justify-center border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16">
          <Typography tone="muted">
            {selectedUserId
              ? `No matching tasks for this person${
                  includeUnassigned ? ' (including unassigned)' : ''
                }.`
              : `No scheduled tasks across selected projects${
                  includeUnassigned ? '' : ' (unassigned hidden)'
                }.`}
          </Typography>
        </div>
      ) : (
        <div className={TIMELINE_BOARD_LAYOUT.board}>
          {/* Left: pinned column header + vertical scroll body */}
          <div
            className={TIMELINE_BOARD_LAYOUT.leftPane}
            style={timelineBoardLeftPaneStyle(leftWidth)}
          >
            <div
              className="flex shrink-0 items-center border-b border-neutral-200 bg-neutral-50 px-1"
              style={{ height: headerH }}
            >
              <div
                className="flex shrink-0 items-center justify-center"
                style={{ width: TIMELINE_LEFT_COLS.CHECKBOX }}
              >
                <TimelineCollapseModeButton
                  mode={tl.collapseMode}
                  onChange={tl.setCollapseMode}
                />
              </div>
              <div
                className="flex items-center text-xs font-medium text-neutral-600"
                style={{ width: TIMELINE_LEFT_COLS.ITEM }}
              >
                Item
              </div>
              <div
                className="flex items-center text-xs font-medium text-neutral-600"
                style={{ width: TIMELINE_LEFT_COLS.STATUS }}
              >
                Assignee
              </div>
            </div>

            <div
              ref={leftScrollRef}
              className={TIMELINE_BOARD_LAYOUT.leftBody}
              onScroll={() => syncScroll('left')}
            >
              {tl.rows.map((row) => {
                const rh = rowHeight(row)
                const isGroup = row.kind === 'phase'
                const projectId =
                  row.itemType === 'PROJECT' ? row.sourceEntityId : null
                const canAssign =
                  (row.kind === 'task' || row.kind === 'milestone') &&
                  !row.assigneeUserId &&
                  Boolean(row.sourceEntityId) &&
                  Boolean(tl.projectIdForTask(row.sourceEntityId))
                const meta = taskMetaLine(row)
                const titleText = row.displayPrimary || row.title
                const hovered = hoverRowId === row.id
                const focused = focusedRowId === row.id
                const isLeaf = row.kind === 'task' || row.kind === 'milestone'
                const canFocusSchedule = isLeaf && Boolean(row.startDate || row.endDate)

                return (
                  <div
                    key={row.id}
                    className={cn(
                      'flex items-stretch border-b border-neutral-100',
                      focused ? ROW_FOCUS : hovered && ROW_HOVER
                    )}
                    style={{ height: rh }}
                    onMouseEnter={() => setHoverRowSafe(row.id)}
                    onMouseLeave={() => setHoverRowSafe(null)}
                  >
                    <div
                      className="flex shrink-0 items-center justify-center"
                      style={{ width: TIMELINE_LEFT_COLS.CHECKBOX }}
                    >
                      {isGroup ? (
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center text-neutral-500 hover:bg-neutral-100"
                          aria-label={row.collapsed ? 'Expand' : 'Collapse'}
                          onClick={() => tl.togglePhase(row.id)}
                        >
                          {row.collapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        'flex min-w-0 flex-col justify-center gap-0.5 pr-2',
                        canFocusSchedule && 'cursor-pointer'
                      )}
                      style={{
                        width: TIMELINE_LEFT_COLS.ITEM,
                        paddingLeft: row.depth * 12,
                      }}
                      title={
                        canFocusSchedule
                          ? `${[titleText, meta].filter(Boolean).join('\n')}\nClick to jump to start on timeline`
                          : [titleText, meta].filter(Boolean).join('\n')
                      }
                      role={canFocusSchedule ? 'button' : undefined}
                      tabIndex={canFocusSchedule ? 0 : undefined}
                      onClick={() => {
                        if (canFocusSchedule) focusTimelineRow(row)
                      }}
                      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (!canFocusSchedule) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          focusTimelineRow(row)
                        }
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-1 text-sm text-neutral-900">
                        <span className="truncate">{titleText}</span>
                        {projectId ? (
                          <NextLink
                            href={ROUTES.workspace.projectTimeline(
                              workspaceId,
                              projectId
                            )}
                            className="shrink-0 text-neutral-400 hover:text-primary-700"
                            title="Open project timeline"
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                              e.stopPropagation()
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </NextLink>
                        ) : null}
                      </div>
                      {meta ? (
                        <div className="truncate text-[11px] leading-tight text-neutral-500">
                          {meta}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className="flex items-center truncate pr-2"
                      style={{ width: TIMELINE_LEFT_COLS.STATUS }}
                    >
                      {isLeaf ? (
                        row.assigneeUserId ? (
                          <Badge size="sm" tone="neutral">
                            {labelFor(row.assigneeUserId)}
                          </Badge>
                        ) : canAssign ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={submitting}
                            title="Assign task"
                            aria-label="Assign task"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation()
                              openAssignModal(row)
                            }}
                          >
                            Assign
                          </Button>
                        ) : (
                          <Badge size="sm" tone="warning">
                            Unassigned
                          </Badge>
                        )
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/*
            Right pane: shared TIMELINE_BOARD_LAYOUT — Day canvasWidth must not expand
            the flex column or horizontal pan dies.
          */}
          <div
            className={TIMELINE_BOARD_LAYOUT.rightPane}
            style={timelineBoardRightPaneStyle}
          >
            <div
              ref={canvasHeaderScrollRef}
              className={TIMELINE_BOARD_LAYOUT.header}
              style={{ height: headerH }}
              aria-hidden
            >
              <div className="flex" style={timelineBoardContentStyle(canvasWidth)}>
                {tl.columns.map((col, colIndex) => {
                  const loadH = dayLoadHours?.[colIndex] ?? null
                  const overloaded =
                    loadH != null && loadH > DAY_CAPACITY_HOURS + 0.05
                  const loadTitle =
                    loadH == null
                      ? `${col.periodStart} – ${col.periodEnd}`
                      : `${col.periodStart} · ${formatDayLoadHours(loadH)} planned` +
                        (overloaded
                          ? ` (over ${DAY_CAPACITY_HOURS}h)`
                          : ` / ${DAY_CAPACITY_HOURS}h`)
                  return (
                    <div
                      key={col.key}
                      className={cn(
                        'flex shrink-0 flex-col items-center justify-center border-r border-neutral-100 px-0.5 text-xs leading-tight',
                        col.isWeekend && !col.isToday && 'bg-neutral-100/80',
                        col.isToday && TODAY_COL,
                        col.isMonthBoundary && !col.isToday && MONTH_BOUNDARY,
                        overloaded && 'bg-error/10'
                      )}
                      style={{ width: tl.colWidth, height: headerH }}
                      title={loadTitle}
                    >
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          col.isToday ? 'text-sky-800' : 'text-neutral-900'
                        )}
                      >
                        {col.label}
                      </span>
                      {col.subLabel ? (
                        <span className="text-[10px] text-neutral-500">{col.subLabel}</span>
                      ) : null}
                      {showDayLoad && loadH != null ? (
                        <span
                          className={cn(
                            'text-[10px] font-semibold tabular-nums',
                            overloaded
                              ? 'text-error'
                              : loadH > 0
                                ? 'text-neutral-700'
                                : 'text-neutral-400'
                          )}
                        >
                          {formatDayLoadHours(loadH)}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              ref={canvasScrollRef}
              className={TIMELINE_BOARD_LAYOUT.canvas}
              style={timelineBoardCanvasStyle}
              title={TIMELINE_BOARD_LAYOUT.canvasTitle}
              onScroll={() => syncScroll('canvas')}
              onMouseDown={onCanvasPanMouseDown}
            >
              {/*
                Day zoom: never mount O(columns) body cells — CSS grid + absolute bars
                so scrollWidth stays correct and the main thread stays responsive.
              */}
              <div
                className="relative box-border"
                style={{ ...canvasGridStyle, ...timelineBoardContentStyle(canvasWidth) }}
              >
                {/* Guarantees scrollWidth even if absolute overlays dominate layout. */}
                <div
                  aria-hidden
                  className="pointer-events-none block"
                  style={{ width: canvasWidth, height: 0 }}
                />
                {weekendRanges.map((range) => (
                  <div
                    key={`we-${range.start}`}
                    className="pointer-events-none absolute inset-y-0 bg-neutral-50"
                    style={{
                      left: range.start * tl.colWidth,
                      width: range.count * tl.colWidth,
                    }}
                    aria-hidden
                  />
                ))}
                {todayColIndex >= 0 ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 border-l border-r border-sky-300 bg-sky-50"
                    style={{
                      left: todayColIndex * tl.colWidth,
                      width: tl.colWidth,
                    }}
                    aria-hidden
                  />
                ) : null}

                <div className="relative" style={timelineBoardContentStyle(canvasWidth)}>
                  {tl.rows.map((row) => {
                    const rh = rowHeight(row)
                    const isLeaf = row.kind === 'task' || row.kind === 'milestone'
                    const buckets = isLeaf ? bucketsByRowId.get(row.id) ?? null : null
                    const bar = barRangeByRowId.get(row.id) ?? null
                    const hovered = hoverRowId === row.id
                    const focused = focusedRowId === row.id
                    const canFocusSchedule =
                      isLeaf && Boolean(row.startDate || row.endDate)
                    return (
                      <div
                        key={row.id}
                        className={cn(
                          'relative border-b border-b-neutral-100',
                          focused ? ROW_FOCUS : hovered && ROW_HOVER,
                          canFocusSchedule && 'cursor-pointer'
                        )}
                        style={{ width: canvasWidth, height: rh }}
                        onMouseEnter={() => setHoverRowSafe(row.id)}
                        onMouseLeave={() => setHoverRowSafe(null)}
                        onClick={() => {
                          if (canFocusSchedule) focusTimelineRow(row)
                        }}
                      >
                        {bar ? (
                          <div
                            className="absolute inset-y-0"
                            style={{ left: bar.left, width: bar.width }}
                          >
                            <ScheduleBucketSegment
                              segment={FULL_BAR_SEGMENT}
                              kind={scheduleFillKindForRow(row)}
                              unassigned={isLeaf && !row.assigneeUserId}
                              progressPercent={
                                metric === TimelineMetric.Schedule && isLeaf
                                  ? row.progressPercent
                                  : null
                              }
                            />
                          </div>
                        ) : null}
                        {metric !== TimelineMetric.Schedule && buckets
                          ? buckets.map((bucket, colIndex) => {
                              const overlay = formatTimelineMetricLabel(
                                metric,
                                bucket,
                                {
                                  // Hierarchy bars stay bar-only; metrics are for leaf tasks.
                                  include: isLeaf,
                                }
                              )
                              if (!overlay) return null
                              const col = tl.columns[colIndex]
                              if (!col) return null
                              return (
                                <span
                                  key={col.key}
                                  className="pointer-events-none absolute inset-y-0 z-[1] flex items-center justify-center truncate px-0.5 text-[10px] font-semibold text-neutral-900"
                                  style={{
                                    left: colIndex * tl.colWidth,
                                    width: tl.colWidth,
                                  }}
                                >
                                  {overlay}
                                </span>
                              )
                            })
                          : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AssignTaskConfirmModal
        open={Boolean(assignTarget)}
        target={assignTarget}
        defaultAssigneeUserId={selectedUserId}
        seedPeople={people}
        submitting={submitting}
        onClose={closeAssignModal}
        onConfirm={confirmAssign}
      />
    </div>
  )
}
