'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Checkbox,
  Input,
  PageSkeleton,
  Stack,
  Typography,
  AnchoredMenu,
  anchoredMenuItemClassName,
} from '@/shared/ui'
import { cn } from '@/utils/cn'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { CreateTaskModal, TaskDetailDrawer, canAssignTask } from '@/modules/projects/task'
import type { CreateTaskPayload, ProjectTask, UpdateTaskPayload } from '@/modules/projects/task'
import { useWorkspaceMembers } from '@/modules/org/workspace'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { useProject } from '../../../project/hooks/useProject'
import { TimelineGranularity, TimelineMetric, TimelineMode } from '../../domain/enums/timeline.enum'
import { buildBucketsForRow } from '../../domain/rules/timeline-buckets.rules'
import {
  addWorkingDays,
  compareDateOnly,
  countWorkingDays,
  maxDateOnly,
  shiftDateRange,
} from '../../domain/rules/working-calendar.rules'
import {
  formatEstimateHours,
  parseEstimateHours,
} from '../../domain/rules/estimate-parse.rules'
import {
  applyFillHandle,
  defaultAnchorStart,
  parsePastedTaskLines,
  scheduleInParallel,
  scheduleSequentially,
  selectTaskRowRange,
  shiftRangeByWorkingDays,
  type FillScheduleMode,
} from '../../domain/rules/timeline-bulk.rules'
import {
  formatTimelineCompactRange,
} from '../../domain/rules/phase-display.rules'
import { phaseHealthLabel } from '../../domain/rules/phase-row-summary.rules'
import type { TimelineFlatRow } from '../../domain/model/timeline'
import { useCellTimeline } from '../hooks/useCellTimeline'
import { useTimelineLeftWidth } from '../hooks/useTimelineLeftWidth'
import { TimelineScheduleHealthBar } from './TimelineScheduleHealthBar'
import { TimelineBulkToolbar } from './TimelineBulkToolbar'
import { UnscheduledWorkDrawer } from './UnscheduledWorkDrawer'
import { ProgressUpdatePopover } from './ProgressUpdatePopover'
import { AllocationEditorPanel } from './AllocationEditorPanel'
import { TimelineDependenciesPanel } from './TimelineDependenciesPanel'
import { TimelineToolbar } from './TimelineToolbar'
import { PhaseDetailDrawer } from './PhaseDetailDrawer'
import { PhaseJumpSelect } from './PhaseJumpSelect'
import { PhaseRichTooltip } from './PhaseRichTooltip'
import { ScheduleBucketSegment } from './ScheduleBucketSegment'
import { buildBucketSegment } from '../../domain/rules/bucket-segment.rules'
import {
  TIMELINE_LEFT_COLS,
  TIMELINE_ROW_HEIGHT,
  timelineRowHeight,
} from '../../domain/model/timeline-layout'
import {
  redistributeEvenly,
  seedManualFromAuto,
  setDayMinutes,
} from '../../domain/rules/allocation.rules'

const HEADER_H = TIMELINE_ROW_HEIGHT.HEADER

/** Current period column (today / this week / month / quarter). */
const TODAY_COL = 'bg-sky-50'

function rowHeight(kind: TimelineFlatRow['kind'], itemType?: string): number {
  return timelineRowHeight(kind, itemType)
}

type DragKind = 'paint' | 'move' | 'resize-start' | 'resize-end'

type DragState = {
  kind: DragKind
  rowId: string
  sourceTaskId: string
  originCol: number
  currentCol: number
  baseStart: string
  baseEnd: string
}

type FillDragState = {
  sourceRowId: string
  originIndex: number
  currentIndex: number
}

type CopiedDates = { startDate: string; endDate: string }

function cellLabel(
  metric: string,
  scheduled: boolean,
  plannedMinutes: number,
  contribution: number | null,
  actual: number | null,
  variance: number | null,
  carryForward: boolean,
  occupancy: number | null
): string {
  if (!scheduled) return ''
  if (metric === TimelineMetric.Effort) {
    if (plannedMinutes <= 0) return ''
    const h = plannedMinutes / 60
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
  }
  if (metric === TimelineMetric.PlannedPercent) {
    return contribution != null ? String(Math.round(contribution)) : ''
  }
  if (metric === TimelineMetric.ActualPercent) {
    if (actual == null) return ''
    return carryForward ? `~${Math.round(actual)}` : String(Math.round(actual))
  }
  if (metric === TimelineMetric.Variance) {
    if (variance == null) return ''
    const rounded = Math.round(variance)
    return rounded > 0 ? `+${rounded}` : String(rounded)
  }
  if (metric === TimelineMetric.Occupancy) {
    if (occupancy == null) return ''
    return `${Math.round(occupancy)}%`
  }
  return ''
}

function daysPerColumn(granularity: string): number {
  if (granularity === TimelineGranularity.Day) return 1
  if (granularity === TimelineGranularity.Week) return 7
  if (granularity === TimelineGranularity.Quarter) return 90
  return 30
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

export function CellTimelineView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const { project } = useProject(workspaceId, projectId)
  const { members } = useWorkspaceMembers(workspaceId)
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { labelFor, personFor } = useResolveUsers(memberUserIds)

  const tl = useCellTimeline(projectId)
  const { leftWidth, setLeftWidth, autoFitToLabels } = useTimelineLeftWidth(projectId)
  const leftScrollRef = useRef<HTMLDivElement>(null)
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)
  const resizingRef = useRef(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [fillDrag, setFillDrag] = useState<FillDragState | null>(null)
  const [fillMenu, setFillMenu] = useState<{
    sourceId: string
    targetIds: string[]
  } | null>(null)
  const [copiedDates, setCopiedDates] = useState<CopiedDates | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [unscheduledOpen, setUnscheduledOpen] = useState(false)
  const [issuesOpen, setIssuesOpen] = useState(false)
  const [addingPhaseId, setAddingPhaseId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [applying, setApplying] = useState(false)
  const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null)
  const [estimateDraft, setEstimateDraft] = useState('')
  const [hoverRowId, setHoverRowId] = useState<string | null>(null)
  const [rowMenuId, setRowMenuId] = useState<string | null>(null)
  const [progressTaskId, setProgressTaskId] = useState<string | null>(null)
  const [progressAnchorRowId, setProgressAnchorRowId] = useState<string | null>(null)
  const [progressSaving, setProgressSaving] = useState(false)
  const [detailTask, setDetailTask] = useState<ProjectTask | null>(null)
  const [detailActing, setDetailActing] = useState(false)
  const [showCriticalPath, setShowCriticalPath] = useState(false)
  const [allocationTaskId, setAllocationTaskId] = useState<string | null>(null)
  const [depsTaskId, setDepsTaskId] = useState<string | null>(null)
  const [phaseDrawerId, setPhaseDrawerId] = useState<string | null>(null)
  const [highlightPhaseId, setHighlightPhaseId] = useState<string | null>(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [createTaskPhaseId, setCreateTaskPhaseId] = useState<string | null>(null)

  const planning = true // Cell editing always on for Day/Week; Month/Quarter are view-first
  const dayPrecision =
    tl.granularity === TimelineGranularity.Day ||
    tl.granularity === TimelineGranularity.Week
  const canEditSchedule = dayPrecision
  const initialFitDone = useRef(false)

  const taskRows = useMemo(
    () => tl.rows.filter((r) => r.kind === 'task'),
    [tl.rows]
  )

  const selectedTasks = useMemo(
    () => taskRows.filter((r) => selectedIds.has(r.id)),
    [taskRows, selectedIds]
  )

  const assigneePeople = useMemo(
    () =>
      members
        .filter((m) => {
          const s = (m.status || '').toUpperCase()
          return s === 'ACTIVE' || s === 'JOINED' || !s
        })
        .map((m) => {
          const person = personFor(m.userId)
          if (person) return person
          return {
            id: m.userId,
            fullName: labelFor(m.userId),
          }
        }),
    [members, personFor, labelFor]
  )

  const drawerPhase = useMemo(
    () => (phaseDrawerId ? tl.allRows.find((r) => r.id === phaseDrawerId) ?? null : null),
    [phaseDrawerId, tl.allRows]
  )

  const nextPhaseAfterDrawer = useMemo(() => {
    if (!drawerPhase) return null
    const phasesOnly = tl.phaseRows
    const idx = phasesOnly.findIndex((p) => p.id === drawerPhase.id)
    return idx >= 0 ? phasesOnly[idx + 1] ?? null : null
  }, [drawerPhase, tl.phaseRows])

  const focusedPhase = useMemo(
    () =>
      tl.focusedPhaseRowId
        ? tl.allRows.find((r) => r.id === tl.focusedPhaseRowId) ?? null
        : null,
    [tl.focusedPhaseRowId, tl.allRows]
  )

  const startLeftResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      resizingRef.current = true
      const startX = e.clientX
      const startW = leftWidth
      const onMove = (ev: MouseEvent) => {
        setLeftWidth(startW + (ev.clientX - startX))
      }
      const onUp = () => {
        resizingRef.current = false
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [leftWidth, setLeftWidth]
  )

  const autoFitLeft = useCallback(() => {
    const labels = tl.rows
      .filter((r) => r.kind === 'phase' || r.kind === 'task')
      .map((r) => r.displayPrimary)
    autoFitToLabels(labels)
  }, [tl.rows, autoFitToLabels])

  const jumpToPhase = useCallback(
    (phaseRowId: string) => {
      tl.expandPhase(phaseRowId)
      tl.setSelectedRowId(phaseRowId)
      const phase = tl.allRows.find((r) => r.id === phaseRowId)
      if (phase) tl.fitToPhase(phase)
      setHighlightPhaseId(phaseRowId)
      window.setTimeout(() => setHighlightPhaseId((id) => (id === phaseRowId ? null : id)), 1800)
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-timeline-row="${phaseRowId}"]`)
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    },
    [tl]
  )

  const openPhaseDrawer = useCallback((phaseRowId: string) => {
    setPhaseDrawerId(phaseRowId)
    tl.setSelectedRowId(phaseRowId)
  }, [tl])

  const syncScroll = useCallback((source: 'left' | 'canvas') => {
    if (syncingRef.current) return
    syncingRef.current = true
    const left = leftScrollRef.current
    const canvas = canvasScrollRef.current
    if (left && canvas) {
      if (source === 'left') canvas.scrollTop = left.scrollTop
      else left.scrollTop = canvas.scrollTop
    }
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }, [])

  const selectRow = useCallback(
    (rowId: string, e?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => {
      const row = tl.rows.find((r) => r.id === rowId)
      if (!row) return

      if (row.kind === 'phase') {
        tl.setSelectedRowId(rowId)
        openPhaseDrawer(rowId)
        return
      }

      if (row.kind !== 'task' && row.kind !== 'milestone') {
        tl.setSelectedRowId(rowId)
        return
      }

      tl.setSelectedRowId(rowId)

      if (e?.shiftKey && anchorId) {
        const range = selectTaskRowRange(taskRows, anchorId, rowId)
        setSelectedIds(new Set(range))
        return
      }

      if (e?.metaKey || e?.ctrlKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(rowId)) next.delete(rowId)
          else next.add(rowId)
          return next
        })
        setAnchorId(rowId)
        return
      }

      setSelectedIds(new Set([rowId]))
      setAnchorId(rowId)
    },
    [anchorId, taskRows, tl, openPhaseDrawer]
  )

  const previewRows = useMemo(() => {
    let rows = tl.rows

    if (drag) {
      const startCol = Math.min(drag.originCol, drag.currentCol)
      const endCol = Math.max(drag.originCol, drag.currentCol)
      let startDate = drag.baseStart
      let endDate = drag.baseEnd

      if (drag.kind === 'paint') {
        startDate = tl.columns[startCol]?.periodStart ?? drag.baseStart
        endDate = tl.columns[endCol]?.periodEnd ?? drag.baseEnd
      } else if (drag.kind === 'move') {
        const delta = drag.currentCol - drag.originCol
        const shifted = shiftDateRange(
          drag.baseStart,
          drag.baseEnd,
          delta * daysPerColumn(tl.granularity)
        )
        startDate = shifted.start
        endDate = shifted.end
      } else if (drag.kind === 'resize-start') {
        const edge = tl.columns[drag.currentCol]?.periodStart
        if (edge) {
          startDate = compareDateOnly(edge, drag.baseEnd) <= 0 ? edge : drag.baseEnd
          endDate = drag.baseEnd
        }
      } else if (drag.kind === 'resize-end') {
        const edge = tl.columns[drag.currentCol]?.periodEnd
        if (edge) {
          startDate = drag.baseStart
          endDate = compareDateOnly(edge, drag.baseStart) >= 0 ? edge : drag.baseStart
        }
      }

      rows = rows.map((r) =>
        r.id === drag.rowId ? { ...r, startDate, endDate } : r
      )
    }

    return rows
  }, [drag, tl.rows, tl.columns, tl.granularity])

  const dragTooltip = useMemo(() => {
    if (!drag) return null
    const row = previewRows.find((r) => r.id === drag.rowId)
    if (!row?.startDate || !row.endDate) return null
    const wd = countWorkingDays(row.startDate, row.endDate)
    return `${row.startDate} → ${row.endDate} · ${wd} working day${wd === 1 ? '' : 's'}`
  }, [drag, previewRows])

  const commitDrag = useCallback(() => {
    if (!drag || !planning) {
      setDrag(null)
      return
    }
    const row = previewRows.find((r) => r.id === drag.rowId)
    if (row?.startDate && row.endDate && drag.sourceTaskId) {
      tl.draft.setSchedule(drag.rowId, drag.sourceTaskId, row.startDate, row.endDate)
    }
    setDrag(null)
  }, [drag, planning, previewRows, tl.draft])

  const commitFillDrag = useCallback(() => {
    if (!fillDrag) return
    const a = Math.min(fillDrag.originIndex, fillDrag.currentIndex)
    const b = Math.max(fillDrag.originIndex, fillDrag.currentIndex)
    const slice = previewRows.slice(a, b + 1)
    const source = slice.find((r) => r.id === fillDrag.sourceRowId)
    const targets = slice.filter(
      (r) => r.id !== fillDrag.sourceRowId && r.kind === 'task'
    )
    setFillDrag(null)
    if (!source || targets.length === 0) return
    setFillMenu({
      sourceId: source.id,
      targetIds: targets.map((t) => t.id),
    })
  }, [fillDrag, previewRows])

  useEffect(() => {
    if (!drag && !fillDrag) return
    const onUp = () => {
      if (drag) commitDrag()
      if (fillDrag) commitFillDrag()
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [drag, fillDrag, commitDrag, commitFillDrag])

  // Auto-fit once when data is ready (must stay above any early returns)
  useEffect(() => {
    if (tl.loading || initialFitDone.current) return
    if (tl.rows.length === 0) return
    initialFitDone.current = true
    if (tl.focusedPhaseRowId) {
      const phase = tl.allRows.find((r) => r.id === tl.focusedPhaseRowId)
      if (phase) tl.fitToPhase(phase)
      else tl.fitToProject()
    } else {
      const hasScheduled = tl.rows.some(
        (r) => (r.kind === 'task' || r.kind === 'phase') && r.startDate && r.endDate
      )
      if (hasScheduled) tl.fitToProject()
      else tl.jumpToToday()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tl.loading, tl.rows.length])

  const applyFillMode = (mode: FillScheduleMode) => {
    if (!fillMenu) return
    const source = previewRows.find((r) => r.id === fillMenu.sourceId)
    const targets = previewRows.filter((r) => fillMenu.targetIds.includes(r.id))
    if (!source) {
      setFillMenu(null)
      return
    }
    const patches = applyFillHandle(source, targets, mode)
    tl.draft.setSchedules(patches)
    setFillMenu(null)
    toast.success(`Applied ${mode.replace('_', ' ')} to ${patches.length} task(s)`)
  }

  const extendSelectedEnd = useCallback(
    (deltaWorkingDays: number) => {
      if (!planning) return
      const targets =
        selectedTasks.length > 0
          ? selectedTasks
          : tl.selectedRowId
            ? taskRows.filter((r) => r.id === tl.selectedRowId)
            : []
      const patches = targets
        .filter((r) => r.sourceEntityId && r.startDate && r.endDate)
        .map((r) => {
          const endDate = addWorkingDays(r.endDate!, deltaWorkingDays)
          const startDate = r.startDate!
          if (compareDateOnly(endDate, startDate) < 0) {
            return {
              itemId: r.id,
              sourceTaskId: r.sourceEntityId!,
              startDate,
              endDate: startDate,
            }
          }
          return {
            itemId: r.id,
            sourceTaskId: r.sourceEntityId!,
            startDate,
            endDate,
          }
        })
      tl.draft.setSchedules(patches)
    },
    [planning, selectedTasks, tl.selectedRowId, taskRows, tl.draft]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        tl.draft.undo()
        return
      }

      if (e.key === 'Escape') {
        setDrag(null)
        setFillDrag(null)
        setFillMenu(null)
        setRowMenuId(null)
        setProgressTaskId(null)
        setProgressAnchorRowId(null)
        setSelectedIds(new Set())
        return
      }

      if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const focus =
          selectedTasks[0] ||
          taskRows.find((r) => r.id === tl.selectedRowId)
        if (focus?.sourceEntityId) {
          e.preventDefault()
          setProgressTaskId(focus.sourceEntityId)
          setProgressAnchorRowId(focus.id)
          tl.setSelectedRowId(focus.id)
        }
        return
      }

      if (e.key === ' ' && tl.selectedRowId) {
        e.preventDefault()
        selectRow(tl.selectedRowId, { metaKey: true })
        return
      }

      if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault()
        extendSelectedEnd(e.key === 'ArrowRight' ? 1 : -1)
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const focus =
          selectedTasks.find((r) => r.startDate && r.endDate) ||
          taskRows.find((r) => r.id === tl.selectedRowId && r.startDate && r.endDate)
        if (focus?.startDate && focus.endDate) {
          e.preventDefault()
          setCopiedDates({ startDate: focus.startDate, endDate: focus.endDate })
          toast.success('Dates copied')
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedDates) {
        const targets =
          selectedTasks.length > 0
            ? selectedTasks
            : taskRows.filter((r) => r.id === tl.selectedRowId)
        const patches = targets
          .filter((r) => r.sourceEntityId)
          .map((r) => ({
            itemId: r.id,
            sourceTaskId: r.sourceEntityId!,
            startDate: copiedDates.startDate,
            endDate: copiedDates.endDate,
          }))
        if (patches.length) {
          e.preventDefault()
          tl.draft.setSchedules(patches)
          toast.success(`Pasted dates to ${patches.length} task(s)`)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    tl.draft,
    tl.selectedRowId,
    selectRow,
    extendSelectedEnd,
    selectedTasks,
    taskRows,
    copiedDates,
  ])

  const startPaint = (row: TimelineFlatRow, colIndex: number) => {
    if (!canEditSchedule || row.kind !== 'task' || !row.sourceEntityId) return
    if (tl.granularity === TimelineGranularity.Month) return
    const col = tl.columns[colIndex]
    if (!col) return
    selectRow(row.id)
    setDrag({
      kind: 'paint',
      rowId: row.id,
      sourceTaskId: row.sourceEntityId,
      originCol: colIndex,
      currentCol: colIndex,
      baseStart: col.periodStart,
      baseEnd: col.periodEnd,
    })
  }

  const startMove = (row: TimelineFlatRow, colIndex: number) => {
    if (!canEditSchedule || !row.startDate || !row.endDate || !row.sourceEntityId) return
    if (tl.granularity === TimelineGranularity.Month) return
    selectRow(row.id)
    setDrag({
      kind: 'move',
      rowId: row.id,
      sourceTaskId: row.sourceEntityId,
      originCol: colIndex,
      currentCol: colIndex,
      baseStart: row.startDate,
      baseEnd: row.endDate,
    })
  }

  const startResize = (row: TimelineFlatRow, colIndex: number, edge: 'start' | 'end') => {
    if (!canEditSchedule || !row.startDate || !row.endDate || !row.sourceEntityId) return
    if (tl.granularity === TimelineGranularity.Month) return
    selectRow(row.id)
    setDrag({
      kind: edge === 'start' ? 'resize-start' : 'resize-end',
      rowId: row.id,
      sourceTaskId: row.sourceEntityId,
      originCol: colIndex,
      currentCol: colIndex,
      baseStart: row.startDate,
      baseEnd: row.endDate,
    })
  }

  const onCellEnter = (colIndex: number) => {
    if (!drag) return
    setDrag((d) => (d ? { ...d, currentCol: colIndex } : d))
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      await tl.applyChanges()
      toast.success('Schedule changes applied')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setApplying(false)
    }
  }

  const openCreateTaskModal = useCallback((phaseId?: string | null) => {
    setCreateTaskPhaseId(phaseId ?? null)
    setCreateTaskOpen(true)
  }, [])

  const handleCreateTaskFromModal = async (body: CreateTaskPayload) => {
    try {
      await tl.createTask(body)
      toast.success('Task created')
      await tl.refetch()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    }
  }

  const handleCreateTask = async (phaseSourceId: string | null, title?: string) => {
    // Duplicate / paste keep quick-create; interactive add uses modal.
    const name = (title ?? newTaskTitle).trim()
    if (!phaseSourceId || !name) return null
    const code = `T-${Date.now().toString(36).slice(-6).toUpperCase()}`
    try {
      const created = await tl.createTask({
        projectPhaseId: phaseSourceId,
        code,
        title: name,
        estimateHours: 8,
      })
      setNewTaskTitle('')
      setAddingPhaseId(null)
      await tl.refetch()
      return created
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      return null
    }
  }

  const handlePasteTasks = async (
    phaseSourceId: string | null,
    text: string
  ) => {
    if (!phaseSourceId || !planning) return
    const lines = parsePastedTaskLines(text)
    if (lines.length === 0) return
    let created = 0
    for (const line of lines) {
      const hours = line.estimateRaw
        ? parseEstimateHours(line.estimateRaw) ?? 8
        : 8
      const code = `T-${Date.now().toString(36).slice(-6).toUpperCase()}${created}`
      try {
        const task = await tl.createTask({
          projectPhaseId: phaseSourceId,
          code,
          title: line.title,
          estimateHours: hours,
          plannedStartDate: line.startDate ?? null,
          dueDate: line.endDate ?? null,
        })
        if (task && line.startDate && line.endDate) {
          // schedule via gantt move after create
          await tl.moveTask(
            task.id,
            {
              manualStartDate: line.startDate,
              manualFinishDate: line.endDate,
              reason: 'Paste schedule',
              recalculate: false,
            },
            { refresh: false }
          )
        }
        created += 1
      } catch {
        // continue remaining lines; interceptor toasts generic errors
      }
    }
    await tl.refetch()
    toast.success(`Created ${created} task(s) from paste`)
  }

  const saveEstimate = async (row: TimelineFlatRow) => {
    if (!row.sourceEntityId) return
    const hours = parseEstimateHours(estimateDraft)
    if (hours == null) {
      toast.error('Invalid estimate (use 8h or 2d)')
      return
    }
    try {
      await tl.updateTask(row.sourceEntityId, { estimateHours: hours })
      setEditingEstimateId(null)
      toast.success('Estimate updated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const scheduleUnscheduledOneDay = (row: TimelineFlatRow, colIndex: number) => {
    if (!canEditSchedule || !row.sourceEntityId) return
    const col = tl.columns[colIndex]
    if (!col) return
    const start = col.periodStart
    const days =
      row.estimateHours != null && row.estimateHours > 0
        ? Math.max(1, Math.ceil(row.estimateHours / 8))
        : 1
    const end = days === 1 ? col.periodEnd : addWorkingDays(start, days - 1)
    tl.draft.setSchedule(row.id, row.sourceEntityId, start, maxDateOnly(start, end))
  }

  const bulkShift = (delta: number) => {
    const patches = selectedTasks
      .filter((r) => r.sourceEntityId && r.startDate && r.endDate)
      .map((r) => {
        const next = shiftRangeByWorkingDays(r.startDate!, r.endDate!, delta)
        return {
          itemId: r.id,
          sourceTaskId: r.sourceEntityId!,
          ...next,
        }
      })
    tl.draft.setSchedules(patches)
  }

  const bulkSequential = () => {
    const patches = scheduleSequentially(
      selectedTasks,
      defaultAnchorStart(selectedTasks)
    )
    tl.draft.setSchedules(patches)
    toast.success('Scheduled sequentially (draft)')
  }

  const bulkParallel = () => {
    const patches = scheduleInParallel(
      selectedTasks,
      defaultAnchorStart(selectedTasks)
    )
    tl.draft.setSchedules(patches)
    toast.success('Scheduled in parallel (draft)')
  }

  const assignableSelectedTasks = useMemo(
    () =>
      selectedTasks.filter(
        (row) => Boolean(row.sourceEntityId) && canAssignTask(row.status ?? '')
      ),
    [selectedTasks]
  )

  const bulkAssign = async (userId: string) => {
    const assignable = assignableSelectedTasks
    const skipped = selectedTasks.length - assignable.length

    if (assignable.length === 0) {
      toast.error('Cannot assign completed or closed tasks')
      return
    }

    try {
      for (const row of assignable) {
        await tl.assignTask(row.sourceEntityId!, userId)
      }
      await tl.refetch()
      toast.success(
        skipped > 0
          ? `Assigned ${assignable.length} task(s); skipped ${skipped} done/closed`
          : `Assigned ${assignable.length} task(s)`
      )
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const bulkArchive = async () => {
    try {
      for (const row of selectedTasks) {
        if (!row.sourceEntityId) continue
        await tl.runLifecycle(row.sourceEntityId, 'archive')
      }
      setSelectedIds(new Set())
      toast.success('Archived selected tasks')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const bulkCopyDates = () => {
    const focus = selectedTasks.find((r) => r.startDate && r.endDate)
    if (!focus?.startDate || !focus.endDate) {
      toast.error('Select a scheduled task to copy dates')
      return
    }
    setCopiedDates({ startDate: focus.startDate, endDate: focus.endDate })
    toast.success('Dates copied — Cmd/Ctrl+V to paste')
  }

  if (tl.loading) return <PageSkeleton />
  if (tl.forbidden) {
    return (
      <Typography tone="muted">You do not have access to this project timeline.</Typography>
    )
  }
  if (tl.error) {
    return <Typography tone="muted">{tl.error}</Typography>
  }

  const canvasWidth = tl.columns.length * tl.colWidth

  return (
    <Stack direction="vertical" spacing="md" className="min-h-0 flex-1">
      <Stack direction="vertical" spacing="xs">
        <WorkspaceHierarchyBreadcrumb
          workspaceId={workspaceId}
          project={project ? { id: projectId, name: project.name } : undefined}
          current="Timeline"
        />
        <div className="flex items-start justify-between gap-3">
          <Stack direction="vertical" spacing="xs" className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Typography as="h1" size="md" weight="medium">
                Timeline
              </Typography>
              <TimelineScheduleHealthBar
                itemCount={tl.taskItemCount}
                scheduledCount={tl.scheduledTaskCount}
                unscheduledCount={tl.unscheduledTasks.length}
                issueCount={tl.issues?.length ?? 0}
                atRiskCount={tl.atRiskCount}
                onOpenScheduled={() => {
                  tl.setHideUnscheduled(true)
                }}
                onOpenUnscheduled={() => setUnscheduledOpen(true)}
                onOpenIssues={() => setIssuesOpen(true)}
                onOpenAtRisk={() => {
                  tl.setMetric(TimelineMetric.Variance)
                  const first = tl.allRows.find((r) => r.atRisk)
                  if (first) selectRow(first.id)
                }}
              />
            </div>
            <Typography className="max-w-2xl truncate text-sm text-neutral-500">
              Plan phases and tasks on a shared calendar — schedule, zoom, and spot risks.
            </Typography>
          </Stack>
          <div className="relative shrink-0 pt-0.5">
            <Button
              variant="ghost"
              size="md"
              className="h-9 bg-neutral-800 px-3 text-[13px] text-white shadow-none hover:bg-neutral-900 hover:text-white active:bg-neutral-950"
              onClick={() => {
                const phase =
                  focusedPhase ??
                  tl.phaseRows.find((p) => !p.collapsed) ??
                  tl.phaseRows[0]
                openCreateTaskModal(phase?.sourceEntityId ?? null)
              }}
            >
              + Add
            </Button>
          </div>
        </div>
      </Stack>

      <TimelineToolbar
        granularity={tl.granularity}
        onGranularity={(g) => tl.setGranularity(g)}
        metric={tl.metric}
        onMetric={(m) => tl.setMetric(m)}
        unscheduledCount={tl.unscheduledTasks.length}
        canUndo={tl.draft.canUndo}
        canRedo={false}
        dirty={tl.draft.dirty}
        applying={applying}
        recalculating={tl.recalculating}
        showCriticalPath={showCriticalPath}
        hideUnscheduled={tl.hideUnscheduled}
        onToday={tl.jumpToToday}
        onFitProject={tl.fitToProject}
        onFitFocusedPhase={
          focusedPhase ? () => tl.fitToPhase(focusedPhase) : null
        }
        onAutoSchedule={() => {
          void (async () => {
            try {
              await tl.recalculate({
                markAsCurrent: true,
                planningStartDate: tl.viewport.start,
                planningEndDate: tl.viewport.end,
              })
              toast.success('Schedule recalculated from estimates and dependencies')
              await tl.loadCriticalPath()
            } catch (err) {
              toast.error(getProblemToastMessage(err))
            }
          })()
        }}
        onUndo={() => tl.draft.undo()}
        onRedo={() => undefined}
        onApply={() => void handleApply()}
        onToggleCriticalPath={() => {
          setShowCriticalPath((v) => !v)
          void tl.loadCriticalPath()
        }}
        onToggleHideUnscheduled={() => tl.setHideUnscheduled((prev: boolean) => !prev)}
        onCaptureBaseline={() => {
          tl.captureBaseline(taskRows)
          toast.success('Baseline captured locally')
        }}
        phaseJumpSlot={<PhaseJumpSelect phases={tl.phaseRows} onJump={jumpToPhase} />}
      />

      {focusedPhase && (
        <Stack
          direction="horizontal"
          spacing="sm"
          className="items-center border border-primary-200 bg-primary-50 px-md py-sm"
        >
          <Typography variant="caption" tone="muted">
            Focused:
          </Typography>
          <Typography variant="caption" weight="medium">
            {focusedPhase.displayPrimary}
          </Typography>
          <Button variant="outline" size="sm" onClick={() => tl.exitFocus()}>
            Exit Focus
          </Button>
        </Stack>
      )}

      {selectedTasks.length > 0 && (
        <TimelineBulkToolbar
          selectedCount={selectedTasks.length}
          assigneePeople={assigneePeople}
          showAssign={assignableSelectedTasks.length > 0}
          onClear={() => setSelectedIds(new Set())}
          onAssign={(id) => void bulkAssign(id)}
          onShift={bulkShift}
          onSequential={bulkSequential}
          onParallel={bulkParallel}
          onArchive={() => void bulkArchive()}
          onCopyDates={bulkCopyDates}
        />
      )}

      {allocationTaskId &&
        (() => {
          const row = taskRows.find((r) => r.sourceEntityId === allocationTaskId)
          if (!row || !row.startDate || !row.endDate) return null
          const plan =
            tl.allocationsByTaskId[allocationTaskId] ??
            seedManualFromAuto(
              allocationTaskId,
              row.startDate,
              row.endDate,
              row.estimateHours
            )
          return (
            <AllocationEditorPanel
              taskTitle={row.title}
              estimateHours={row.estimateHours}
              plan={plan}
              onClose={() => setAllocationTaskId(null)}
              onChangeDay={(workDate, hours) => {
                const next = setDayMinutes(plan, workDate, hours * 60)
                tl.saveAllocation(next)
              }}
              onRedistribute={() => {
                if (row.estimateHours == null) {
                  toast.error('Set an estimate before redistributing')
                  return
                }
                tl.saveAllocation(
                  redistributeEvenly(
                    allocationTaskId,
                    row.startDate!,
                    row.endDate!,
                    row.estimateHours
                  )
                )
              }}
              onClearManual={() => {
                tl.clearAllocation(allocationTaskId)
                toast.success('Back to auto allocation')
              }}
            />
          )
        })()}

      {depsTaskId &&
        (() => {
          const row = taskRows.find((r) => r.sourceEntityId === depsTaskId)
          if (!row) return null
          const other = selectedTasks.find(
            (t) => t.sourceEntityId && t.sourceEntityId !== depsTaskId
          )
          return (
            <TimelineDependenciesPanel
              taskTitle={row.title}
              taskId={depsTaskId}
              dependencies={tl.ganttDependencies}
              canLinkToSelected={Boolean(other?.sourceEntityId)}
              selectedOtherTitle={other?.title}
              onClose={() => setDepsTaskId(null)}
              onLinkFs={() => {
                if (!other?.sourceEntityId) return
                void (async () => {
                  try {
                    await tl.addDependency({
                      predecessorTaskId: depsTaskId,
                      successorTaskId: other.sourceEntityId!,
                      dependencyType: 'FS',
                      lagDays: 0,
                    })
                    toast.success('Dependency created')
                  } catch (err) {
                    toast.error(getProblemToastMessage(err))
                  }
                })()
              }}
              onRemove={(depId) => {
                void (async () => {
                  try {
                    await tl.removeDependency(depId)
                    toast.success('Dependency removed')
                  } catch (err) {
                    toast.error(getProblemToastMessage(err))
                  }
                })()
              }}
            />
          )
        })()}

      {dragTooltip && (
        <div className="pointer-events-none fixed bottom-md left-1/2 z-50 -translate-x-1/2 bg-neutral-900 px-md py-sm text-sm text-white shadow-md">
          {dragTooltip}
        </div>
      )}

      {fillMenu && (
        <div className="fixed bottom-xl left-1/2 z-50 flex -translate-x-1/2 gap-sm border border-neutral-200 bg-white p-sm shadow-md">
          <Button size="sm" variant="outline" onClick={() => applyFillMode('copy')}>
            Copy schedule
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyFillMode('sequential')}>
            Schedule sequentially
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyFillMode('same_duration')}>
            Same duration
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFillMenu(null)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="flex min-h-[420px] flex-1 overflow-hidden border border-neutral-200 bg-white">
        <div
          className="flex shrink-0 flex-col border-r border-neutral-200"
          style={{ width: leftWidth }}
        >
          <div
            className="flex shrink-0 items-center border-b border-neutral-200 bg-neutral-50 px-sm text-xs font-medium text-neutral-600"
            style={{ height: HEADER_H }}
          >
            <div className="shrink-0" style={{ width: TIMELINE_LEFT_COLS.CHECKBOX }} />
            <div
              className="min-w-0 shrink-0 truncate"
              style={{ width: TIMELINE_LEFT_COLS.ITEM }}
            >
              Item
            </div>
            <div
              className="shrink-0 truncate"
              style={{ width: TIMELINE_LEFT_COLS.STATUS }}
            >
              Status
            </div>
            <div
              className="shrink-0 truncate"
              style={{ width: TIMELINE_LEFT_COLS.PROGRESS }}
            >
              %
            </div>
            <div
              className="shrink-0 truncate"
              style={{ width: TIMELINE_LEFT_COLS.ESTIMATE }}
            >
              Est.
            </div>
          </div>
          <div
            ref={leftScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={() => syncScroll('left')}
          >
            {previewRows.map((row, rowIndex) => (
              <LeftRow
                key={row.id}
                row={row}
                selected={selectedIds.has(row.id) || tl.selectedRowId === row.id}
                multiChecked={selectedIds.has(row.id)}
                hovered={hoverRowId === row.id}
                highlighted={highlightPhaseId === row.id}
                menuOpen={rowMenuId === row.id}
                onHover={(h) => setHoverRowId(h ? row.id : null)}
                onSelect={(e) => selectRow(row.id, e)}
                onToggleCheck={() => selectRow(row.id, { metaKey: true })}
                onTogglePhase={() => tl.togglePhase(row.id)}
                assigneeLabel={
                  row.assigneeUserId ? labelFor(row.assigneeUserId) || null : null
                }
                adding={row.kind === 'add' && addingPhaseId === row.parentPhaseSourceId}
                newTaskTitle={newTaskTitle}
                onNewTaskTitle={setNewTaskTitle}
                onStartAdd={() => {
                  openCreateTaskModal(row.parentPhaseSourceId)
                }}
                onCreate={() => void handleCreateTask(row.parentPhaseSourceId)}
                onCancelAdd={() => {
                  setAddingPhaseId(null)
                  setNewTaskTitle('')
                }}
                onPasteNames={(text) =>
                  void handlePasteTasks(row.parentPhaseSourceId, text)
                }
                editingEstimate={editingEstimateId === row.id}
                estimateDraft={estimateDraft}
                onEditEstimate={() => {
                  setEditingEstimateId(row.id)
                  setEstimateDraft(formatEstimateHours(row.estimateHours))
                }}
                onEstimateDraft={setEstimateDraft}
                onSaveEstimate={() => void saveEstimate(row)}
                onCancelEstimate={() => setEditingEstimateId(null)}
                planning={planning}
                onToggleMenu={() =>
                  setRowMenuId((id) => (id === row.id ? null : row.id))
                }
                onDuplicateBelow={() => {
                  if (!row.parentPhaseSourceId) return
                  void handleCreateTask(row.parentPhaseSourceId, `${row.title} (copy)`)
                  setRowMenuId(null)
                }}
                onScheduleToday={() => {
                  if (!row.sourceEntityId) return
                  const start = defaultAnchorStart([row])
                  const days =
                    row.estimateHours != null && row.estimateHours > 0
                      ? Math.max(1, Math.ceil(row.estimateHours / 8))
                      : 1
                  tl.draft.setSchedule(
                    row.id,
                    row.sourceEntityId,
                    start,
                    addWorkingDays(start, days - 1)
                  )
                  toast.success('Scheduled from today (draft) — Apply to save')
                  setRowMenuId(null)
                }}
                onOpenTask={() => {
                  if (!row.sourceEntityId) return
                  void (async () => {
                    try {
                      const task = await tl.getTask(row.sourceEntityId!)
                      if (task) setDetailTask(task)
                      else toast.error('Task not found')
                    } catch (err) {
                      toast.error(getProblemToastMessage(err))
                    }
                  })()
                  setRowMenuId(null)
                }}
                onUpdateProgress={() => {
                  if (row.sourceEntityId) {
                    setProgressTaskId(row.sourceEntityId)
                    setProgressAnchorRowId(row.id)
                  }
                  setRowMenuId(null)
                }}
                onEditAllocation={() => {
                  if (row.sourceEntityId) setAllocationTaskId(row.sourceEntityId)
                  setRowMenuId(null)
                }}
                onEditDeps={() => {
                  if (row.sourceEntityId) setDepsTaskId(row.sourceEntityId)
                  setRowMenuId(null)
                }}
                fillActive={
                  fillDrag != null &&
                  rowIndex >= Math.min(fillDrag.originIndex, fillDrag.currentIndex) &&
                  rowIndex <= Math.max(fillDrag.originIndex, fillDrag.currentIndex)
                }
              />
            ))}
          </div>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize task column"
          title="Drag to resize · Double-click to auto-fit"
          className="w-1.5 shrink-0 cursor-col-resize bg-neutral-100 hover:bg-primary-200"
          onMouseDown={startLeftResize}
          onDoubleClick={autoFitLeft}
        />

        <div
          ref={canvasScrollRef}
          className="min-w-0 flex-1 overflow-auto"
          onScroll={() => syncScroll('canvas')}
        >
          <div style={{ width: canvasWidth, minWidth: '100%' }}>
            <div
              className="sticky top-0 z-10 flex border-b border-neutral-200 bg-neutral-50"
              style={{ height: HEADER_H }}
            >
              {tl.columns.map((col) => (
                <div
                  key={col.key}
                  className={cn(
                    'flex shrink-0 flex-col items-center justify-center border-r border-neutral-100 px-0.5 text-xs leading-tight',
                    col.isWeekend && !col.isToday && 'bg-neutral-100/80',
                    col.isToday && TODAY_COL
                  )}
                  style={{ width: tl.colWidth }}
                  title={
                    col.isToday
                      ? `Current · ${col.periodStart} – ${col.periodEnd}`
                      : `${col.periodStart} – ${col.periodEnd}`
                  }
                >
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      col.isToday ? 'text-sky-800' : 'text-neutral-900'
                    )}
                  >
                    {col.label}
                  </span>
                  {col.subLabel && (
                    <span
                      className={cn(
                        'text-[11px]',
                        col.isToday ? 'text-sky-700/80' : 'text-neutral-600'
                      )}
                    >
                      {col.subLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {previewRows.map((row, rowIndex) => {
              const buckets = buildBucketsForRow(
                tl.columns,
                row.startDate,
                row.endDate,
                row.estimateHours,
                {
                  taskId: row.sourceEntityId,
                  snapshots: tl.progressSnapshots,
                  manualAllocation: row.sourceEntityId
                    ? tl.allocationsByTaskId[row.sourceEntityId] ?? null
                    : null,
                }
              )
              const isSelected =
                selectedIds.has(row.id) || tl.selectedRowId === row.id
              const onCritical =
                showCriticalPath &&
                row.sourceEntityId != null &&
                tl.criticalTaskIds.has(row.sourceEntityId)
              const baseline =
                row.sourceEntityId && tl.baseline[row.sourceEntityId]
                  ? tl.baseline[row.sourceEntityId]
                  : null
              const lastFilledIndex = buckets.reduce(
                (acc, b, i) => (b.scheduled ? i : acc),
                -1
              )

              return (
                <div
                  key={row.id}
                  className={cn(
                    'relative flex border-b border-neutral-100',
                    isSelected && 'bg-primary-50/40',
                    row.kind === 'phase' && 'bg-neutral-50/60',
                    highlightPhaseId === row.id && 'bg-primary-100/70',
                    row.atRisk && row.kind !== 'phase' && 'bg-error-50/50',
                    onCritical && 'ring-1 ring-inset ring-warning-500',
                    fillDrag &&
                      rowIndex >= Math.min(fillDrag.originIndex, fillDrag.currentIndex) &&
                      rowIndex <= Math.max(fillDrag.originIndex, fillDrag.currentIndex) &&
                      'bg-primary-100/50'
                  )}
                  data-timeline-row={row.id}
                  style={{ height: rowHeight(row.kind) }}
                  onClick={() => {
                    if (row.kind === 'phase') openPhaseDrawer(row.id)
                  }}
                  title={
                    baseline
                      ? `Baseline: ${baseline.startDate ?? '—'} → ${baseline.endDate ?? '—'}`
                      : undefined
                  }
                  onMouseEnter={() => {
                    setHoverRowId(row.id)
                    if (fillDrag) {
                      setFillDrag((d) => (d ? { ...d, currentIndex: rowIndex } : d))
                    }
                  }}
                  onMouseLeave={() => setHoverRowId((id) => (id === row.id ? null : id))}
                >
                  {tl.columns.map((col, colIndex) => {
                    const bucket = buckets[colIndex]
                    const segment =
                      row.startDate &&
                      row.endDate &&
                      (row.kind === 'task' ||
                        row.kind === 'milestone' ||
                        row.kind === 'phase')
                        ? buildBucketSegment(
                            row.startDate,
                            row.endDate,
                            col.periodStart,
                            col.periodEnd
                          )
                        : null
                    const filled = Boolean(segment)
                    const label = cellLabel(
                      tl.metric,
                      filled && row.kind !== 'phase',
                      bucket?.plannedMinutes ?? 0,
                      bucket?.plannedContributionPercent ?? null,
                      bucket?.actualProgressPercent ?? null,
                      bucket?.variancePercent ?? null,
                      bucket?.actualIsCarryForward ?? false,
                      bucket?.occupancyPercent ?? null
                    )
                    const isEdgeStart = Boolean(segment?.isFirst)
                    const isEdgeEnd = Boolean(segment?.isLast)
                    const rh = rowHeight(row.kind, row.itemType)

                    return (
                      <div
                        key={col.key}
                        className={cn(
                          'group relative shrink-0 border-b border-neutral-100 border-r border-neutral-200',
                          col.isWeekend && !col.isToday && 'bg-neutral-50',
                          col.isToday && TODAY_COL,
                          canEditSchedule && row.kind === 'task' && 'cursor-cell',
                          canEditSchedule &&
                            row.kind === 'task' &&
                            !filled &&
                            !row.startDate &&
                            hoverRowId === row.id &&
                            !col.isToday &&
                            'bg-primary-50'
                        )}
                        style={{ width: tl.colWidth, height: rh }}
                        onMouseEnter={() => onCellEnter(colIndex)}
                        onMouseDown={(e) => {
                          if (!canEditSchedule || row.kind !== 'task') return
                          e.preventDefault()
                          if (filled && isEdgeStart) {
                            startResize(row, colIndex, 'start')
                          } else if (filled && isEdgeEnd) {
                            startResize(row, colIndex, 'end')
                          } else if (filled) {
                            startMove(row, colIndex)
                          } else if (!row.startDate) {
                            scheduleUnscheduledOneDay(row, colIndex)
                            startPaint(row, colIndex)
                          } else {
                            startPaint(row, colIndex)
                          }
                        }}
                        title={
                          !filled &&
                          row.kind === 'task' &&
                          !row.startDate &&
                          canEditSchedule
                            ? 'Drag across cells to schedule'
                            : filled
                              ? [
                                  row.displayPrimary,
                                  `${row.startDate} → ${row.endDate}`,
                                  row.progressPercent != null
                                    ? `Progress: ${Math.round(row.progressPercent)}%`
                                    : null,
                                  row.kind === 'phase' && row.phaseSummary
                                    ? `${row.phaseSummary.taskCount} tasks`
                                    : null,
                                  row.status ? `Status: ${row.status}` : null,
                                ]
                                  .filter(Boolean)
                                  .join('\n')
                              : col.periodStart
                        }
                      >
                        {segment && (
                          <ScheduleBucketSegment
                            segment={segment}
                            kind={
                              row.kind === 'milestone'
                                ? 'milestone'
                                : row.kind === 'phase'
                                  ? 'phase'
                                  : 'task'
                            }
                            progressPercent={
                              row.kind === 'phase' || row.kind === 'task'
                                ? row.progressPercent
                                : null
                            }
                            atRisk={row.atRisk}
                            selected={isSelected}
                            showHandles={
                              canEditSchedule && row.kind === 'task' && filled
                            }
                            metricLabel={
                              row.kind === 'phase'
                                ? undefined
                                : label || undefined
                            }
                            onResizeStart={(edge) => {
                              startResize(row, colIndex, edge)
                            }}
                          />
                        )}
                        {!filled &&
                          row.kind === 'task' &&
                          !row.startDate &&
                          canEditSchedule &&
                          hoverRowId === row.id &&
                          colIndex === 0 && (
                            <span className="pointer-events-none absolute left-2 top-1/2 z-[2] -translate-y-1/2 whitespace-nowrap text-[11px] font-medium text-primary-700">
                              Drag across cells to schedule
                            </span>
                          )}
                        {canEditSchedule &&
                          filled &&
                          colIndex === lastFilledIndex &&
                          row.kind === 'task' && (
                            <button
                              type="button"
                              aria-label="Fill handle"
                              className="absolute -bottom-1 -right-1 z-10 h-2.5 w-2.5 cursor-ns-resize border border-white bg-primary-700"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setFillDrag({
                                  sourceRowId: row.id,
                                  originIndex: rowIndex,
                                  currentIndex: rowIndex,
                                })
                              }}
                            />
                          )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <PhaseDetailDrawer
        open={phaseDrawerId != null}
        onClose={() => setPhaseDrawerId(null)}
        phase={drawerPhase}
        nextPhase={nextPhaseAfterDrawer}
        onFocusPhase={() => {
          if (!phaseDrawerId) return
          tl.focusPhase(phaseDrawerId)
          setPhaseDrawerId(null)
        }}
        onCollapseOthers={() => {
          if (!phaseDrawerId) return
          tl.collapseOtherPhases(phaseDrawerId)
        }}
        onAddTask={() => {
          openCreateTaskModal(drawerPhase?.sourceEntityId ?? null)
          setPhaseDrawerId(null)
        }}
        onFitDates={() => {
          if (drawerPhase) tl.fitToPhase(drawerPhase)
        }}
      />

      <CreateTaskModal
        open={createTaskOpen}
        phases={tl.phases}
        initialPhaseId={createTaskPhaseId}
        onClose={() => {
          setCreateTaskOpen(false)
          setCreateTaskPhaseId(null)
        }}
        onSubmit={handleCreateTaskFromModal}
      />

      <TaskDetailDrawer
        workspaceId={workspaceId}
        projectId={projectId}
        phases={tl.phases}
        task={detailTask}
        open={!!detailTask}
        acting={detailActing}
        onClose={() => setDetailTask(null)}
        onLifecycle={async (taskId, action) => {
          setDetailActing(true)
          try {
            await tl.runLifecycle(taskId, action)
            toast.success('Task updated')
            const refreshed = await tl.getTask(taskId)
            if (refreshed) setDetailTask(refreshed)
            await tl.refetch()
          } catch (err) {
            toast.error(getProblemToastMessage(err))
          } finally {
            setDetailActing(false)
          }
        }}
        onSave={async (taskId, body: UpdateTaskPayload) => {
          try {
            const updated = await tl.updateTask(taskId, body)
            if (updated) setDetailTask(updated)
            toast.success('Saved')
            await tl.refetch()
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <UnscheduledWorkDrawer
        open={unscheduledOpen}
        onClose={() => setUnscheduledOpen(false)}
        items={tl.unscheduledTasks}
        onSelect={(id) => {
          selectRow(id)
          tl.setMode(TimelineMode.Planning)
        }}
      />

      <UnscheduledWorkDrawer
        open={issuesOpen}
        onClose={() => setIssuesOpen(false)}
        title="Schedule issues"
        emptyLabel="No schedule issues."
        hint="Issues from the gantt checker. Fix dates or dependencies in Planning mode."
        items={(tl.issues ?? []).map((issue, i) => ({
          id: String(issue.id ?? i),
          kind: 'task' as const,
          depth: 0,
          title: issue.description || issue.issueType || 'Issue',
          displayPrimary: issue.description || issue.issueType || 'Issue',
          displaySecondary: null,
          phaseCode: null,
          itemType: 'ISSUE',
          sourceEntityId: issue.affectedEntityId,
          phaseId: null,
          parentPhaseSourceId: null,
          scheduleStatus: '',
          assigneeUserId: null,
          estimateHours: null,
          status: null,
          progressPercent: null,
          atRisk: false,
          startDate: null,
          endDate: null,
        }))}
        onSelect={() => setIssuesOpen(false)}
      />

      {progressTaskId && progressAnchorRowId && (
        <ProgressUpdatePopover
          anchorRowId={progressAnchorRowId}
          taskTitle={
            taskRows.find((r) => r.sourceEntityId === progressTaskId)?.title ??
            'Task'
          }
          initialPercent={
            taskRows.find((r) => r.sourceEntityId === progressTaskId)
              ?.progressPercent ?? null
          }
          saving={progressSaving}
          storageHint={
            tl.progressSource === 'local'
              ? 'Saved locally until BE progress-snapshots API is available.'
              : null
          }
          onClose={() => {
            setProgressTaskId(null)
            setProgressAnchorRowId(null)
          }}
          onSave={async (body: {
            progressPercent: number
            timeSpentMinutes: number | null
            note: string | null
          }) => {
            setProgressSaving(true)
            try {
              const snap = await tl.recordProgress(progressTaskId, body)
              toast.success(
                `Progress ${body.progressPercent}% saved` +
                  (tl.progressSource === 'local' || !snap ? ' (local until BE ships)' : '')
              )
              setProgressTaskId(null)
              setProgressAnchorRowId(null)
            } catch (err) {
              toast.error(getProblemToastMessage(err))
            } finally {
              setProgressSaving(false)
            }
          }}
        />
      )}
    </Stack>
  )
}

function LeftRow({
  row,
  selected,
  multiChecked,
  hovered,
  highlighted,
  menuOpen,
  onHover,
  onSelect,
  onToggleCheck,
  onTogglePhase,
  assigneeLabel,
  adding,
  newTaskTitle,
  onNewTaskTitle,
  onStartAdd,
  onCreate,
  onCancelAdd,
  onPasteNames,
  editingEstimate,
  estimateDraft,
  onEditEstimate,
  onEstimateDraft,
  onSaveEstimate,
  onCancelEstimate,
  planning,
  onToggleMenu,
  onDuplicateBelow,
  onScheduleToday,
  onOpenTask,
  onUpdateProgress,
  onEditAllocation,
  onEditDeps,
  fillActive,
}: {
  row: TimelineFlatRow
  selected: boolean
  multiChecked: boolean
  hovered: boolean
  highlighted: boolean
  menuOpen: boolean
  onHover: (hover: boolean) => void
  onSelect: (e: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => void
  onToggleCheck: () => void
  onTogglePhase: () => void
  assigneeLabel: string | null
  adding: boolean
  newTaskTitle: string
  onNewTaskTitle: (v: string) => void
  onStartAdd: () => void
  onCreate: () => void
  onCancelAdd: () => void
  onPasteNames: (text: string) => void
  editingEstimate: boolean
  estimateDraft: string
  onEditEstimate: () => void
  onEstimateDraft: (v: string) => void
  onSaveEstimate: () => void
  onCancelEstimate: () => void
  planning: boolean
  onToggleMenu: () => void
  onDuplicateBelow: () => void
  onScheduleToday: () => void
  onOpenTask: () => void
  onUpdateProgress: () => void
  onEditAllocation: () => void
  onEditDeps: () => void
  fillActive: boolean
}) {
  const menuAnchorRef = useRef<HTMLDivElement>(null)
  const h = rowHeight(row.kind)

  if (row.kind === 'add') {
    if (!planning) return <div style={{ height: TIMELINE_ROW_HEIGHT.TASK }} />
    return (
      <div
        className="flex items-center gap-sm border-b border-neutral-100 px-sm"
        style={{ height: TIMELINE_ROW_HEIGHT.ADD_TASK, paddingLeft: 8 + row.depth * 12 }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text')
          if (text.includes('\n') || text.includes('\t')) {
            e.preventDefault()
            onPasteNames(text)
          }
        }}
      >
        {adding ? (
          <Input
            autoFocus
            value={newTaskTitle}
            placeholder="Task name — or paste a list"
            className="h-7 text-sm"
            onChange={(e) => onNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreate()
              if (e.key === 'Escape') onCancelAdd()
            }}
            onBlur={() => {
              if (newTaskTitle.trim()) onCreate()
              else onCancelAdd()
            }}
          />
        ) : (
          <button
            type="button"
            className="text-sm text-primary-700 hover:underline"
            onClick={onStartAdd}
          >
            + Add task
          </button>
        )}
      </div>
    )
  }

  if (row.kind === 'phase') {
    const summary = row.phaseSummary
    const health = summary ? phaseHealthLabel(summary) : null
    const metaBits: string[] = []
    if (row.displaySecondary) metaBits.push(row.displaySecondary)
    else if (row.phaseCode) metaBits.push(row.phaseCode)
    if (row.startDate && row.endDate) {
      metaBits.push(formatTimelineCompactRange(row.startDate, row.endDate))
    }
    if (row.collapsed && summary) {
      metaBits.length = 0
      if (row.displaySecondary) metaBits.push(row.displaySecondary)
      metaBits.push(
        `${summary.taskCount} tasks · ${
          summary.progressPercent != null ? `${summary.progressPercent}%` : '—'
        }`
      )
      if (summary.unscheduledCount > 0) {
        metaBits.push(`${summary.unscheduledCount} unscheduled`)
      }
      if (health) metaBits.push(health)
    }

    return (
      <PhaseRichTooltip phase={row}>
        {({ onMouseEnter, onMouseLeave }) => (
          <div
            role="button"
            tabIndex={0}
            data-timeline-row={row.id}
            onMouseEnter={(e) => {
              onHover(true)
              onMouseEnter(e)
            }}
            onMouseLeave={() => {
              onHover(false)
              onMouseLeave()
            }}
            onClick={(e) =>
              onSelect({ shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSelect({})
            }}
            className={cn(
              'group relative flex cursor-pointer items-stretch border-b border-neutral-100 bg-neutral-50/80 px-sm text-sm',
              selected && 'bg-primary-50',
              highlighted && 'bg-primary-100',
              row.atRisk && 'bg-error-50/40'
            )}
            style={{ height: h, minHeight: h }}
          >
            <div
              className="flex shrink-0 items-start justify-center pt-sm"
              style={{ width: TIMELINE_LEFT_COLS.CHECKBOX }}
            >
              <button
                type="button"
                className="shrink-0 text-neutral-500"
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePhase()
                }}
                aria-label={row.collapsed ? 'Expand' : 'Collapse'}
              >
                {row.collapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div
              className="min-w-0 shrink-0 overflow-hidden py-xs"
              style={{ width: TIMELINE_LEFT_COLS.ITEM, paddingLeft: row.depth * 12 }}
            >
              <div
                className="font-semibold leading-snug text-neutral-900"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'normal',
                }}
                title={row.title}
              >
                {row.displayPrimary}
              </div>
              {metaBits.length > 0 && (
                <div className="mt-0.5 truncate whitespace-nowrap text-[12px] leading-4 text-neutral-500">
                  {metaBits.join(' · ')}
                </div>
              )}
            </div>
            <div
              className="flex shrink-0 items-center truncate text-xs text-neutral-600"
              style={{ width: TIMELINE_LEFT_COLS.STATUS }}
            >
              {health ? (
                <Badge
                  tone={health === 'Has gaps' ? 'warning' : 'error'}
                  variant="solid"
                  size="sm"
                >
                  {health}
                </Badge>
              ) : (
                <span className="truncate">{row.status ?? ''}</span>
              )}
            </div>
            <div
              className="flex shrink-0 items-center truncate text-xs font-medium text-neutral-700"
              style={{ width: TIMELINE_LEFT_COLS.PROGRESS }}
            >
              {row.progressPercent != null ? `${Math.round(row.progressPercent)}%` : '—'}
            </div>
            <div className="shrink-0" style={{ width: TIMELINE_LEFT_COLS.ESTIMATE }} />
          </div>
        )}
      </PhaseRichTooltip>
    )
  }

  const durationDays =
    row.startDate && row.endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(`${row.endDate}T12:00:00`).getTime() -
              new Date(`${row.startDate}T12:00:00`).getTime()) /
              86400000
          ) + 1
        )
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      data-timeline-row={row.id}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={(e) =>
        onSelect({ shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey })
      }
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect({})
        if (e.key === ' ') {
          e.preventDefault()
          onToggleCheck()
        }
      }}
      className={cn(
        'group relative flex cursor-pointer items-center border-b border-neutral-100 px-sm text-sm',
        selected && 'bg-primary-50',
        fillActive && 'bg-primary-100/60',
        row.atRisk && 'bg-error-50'
      )}
      style={{ height: h }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ width: TIMELINE_LEFT_COLS.CHECKBOX }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          size="sm"
          checked={multiChecked}
          onChange={() => onToggleCheck()}
          aria-label={`Select ${row.title}`}
        />
      </div>
      <div
        className="relative min-w-0 shrink-0 overflow-hidden"
        style={{ width: TIMELINE_LEFT_COLS.ITEM, paddingLeft: row.depth * 12 }}
      >
        <div className="flex min-w-0 items-center gap-xs overflow-hidden pr-14">
          <span className="w-3.5 shrink-0" />
          <button
            type="button"
            className="min-w-0 flex-1 truncate whitespace-nowrap text-left hover:underline"
            title={row.title}
            onClick={(e) => {
              e.stopPropagation()
              onOpenTask()
            }}
          >
            {row.displayPrimary}
          </button>
        </div>
        <div className="truncate whitespace-nowrap pl-[18px] pr-14 text-[12px] leading-4 text-neutral-500">
          {[
            !row.startDate ? 'Unscheduled' : null,
            row.atRisk ? 'At risk' : null,
            assigneeLabel,
            row.status,
            durationDays != null ? `${durationDays}d` : null,
            planning && editingEstimate
              ? null
              : formatEstimateHours(row.estimateHours) || null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
        {(hovered || menuOpen) && (
          <div
            ref={menuAnchorRef}
            className="absolute right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-0.5 bg-white/95 pl-1"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-sm font-medium text-primary-700 hover:bg-neutral-100"
              title="Schedule from today"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onScheduleToday()
              }}
            >
              +
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-neutral-600 hover:bg-neutral-100"
              title="More actions"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleMenu()
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <AnchoredMenu
              open={menuOpen}
              onClose={() => {
                if (menuOpen) onToggleMenu()
              }}
              anchorRef={menuAnchorRef}
              minWidth={200}
            >
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  onToggleMenu()
                  onOpenTask()
                }}
              >
                Open / Edit
              </button>
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  onToggleMenu()
                  onUpdateProgress()
                }}
              >
                Update progress
              </button>
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  onToggleMenu()
                  onScheduleToday()
                }}
              >
                Schedule from today
              </button>
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  onToggleMenu()
                  onEditAllocation()
                }}
              >
                Edit allocation
              </button>
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  onToggleMenu()
                  onEditDeps()
                }}
              >
                Dependencies
              </button>
              <button
                type="button"
                className={anchoredMenuItemClassName}
                onClick={() => {
                  onToggleMenu()
                  onDuplicateBelow()
                }}
              >
                Duplicate below
              </button>
            </AnchoredMenu>
          </div>
        )}
      </div>
      <div
        className="shrink-0 truncate text-xs text-neutral-600"
        style={{ width: TIMELINE_LEFT_COLS.STATUS }}
      >
        {row.status ?? '—'}
      </div>
      <div
        className="shrink-0 truncate text-xs text-neutral-600"
        style={{ width: TIMELINE_LEFT_COLS.PROGRESS }}
      >
        <button
          type="button"
          className="hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateProgress()
          }}
          title="Update progress (P)"
        >
          {row.progressPercent != null ? `${Math.round(row.progressPercent)}%` : '—'}
        </button>
      </div>
      <div
        className="shrink-0 truncate text-xs text-neutral-600"
        style={{ width: TIMELINE_LEFT_COLS.ESTIMATE }}
      >
        {planning && editingEstimate ? (
          <Input
            autoFocus
            value={estimateDraft}
            className="h-7 text-xs"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onEstimateDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') onSaveEstimate()
              if (e.key === 'Escape') onCancelEstimate()
            }}
            onBlur={onSaveEstimate}
          />
        ) : (
          <button
            type="button"
            className={cn('truncate', planning && 'hover:underline')}
            onClick={(e) => {
              e.stopPropagation()
              if (planning) onEditEstimate()
            }}
          >
            {formatEstimateHours(row.estimateHours) || '—'}
          </button>
        )}
      </div>
    </div>
  )
}
