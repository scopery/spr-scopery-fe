'use client'

import { useCallback, useMemo, useState } from 'react'
import { useProjectGantt } from './useProjectGantt'
import { useProjectTasks } from '../../../task/presentation/hooks/useProjectTasks'
import { useProjectPhases } from '../../../phase/presentation/hooks/useProjectPhases'
import { phaseWatchStatusLabel } from '../../../phase/domain/rules/phase-watch.rules'
import { useTaskProgressSnapshots } from './useTaskProgressSnapshots'
import { useTaskAllocations } from './useTaskAllocations'
import { TimelineGranularity, TimelineMetric, TimelineMode } from '../../domain/enums/timeline.enum'
import type { TimelineGranularity as Granularity, TimelineMetric as Metric, TimelineMode as Mode } from '../../domain/enums/timeline.enum'
import { buildTimelineColumns, cellWidthPx } from '../../domain/rules/timeline-buckets.rules'
import {
  applyDraftToRows,
  filterRowsToFocusedPhase,
  flattenTimelineRows,
  type PhaseEnrichment,
  type TaskEnrichment,
} from '../../domain/rules/timeline-rows.rules'
import {
  pickFitGranularity,
  resolveTimelineViewport,
  viewportAroundToday,
} from '../../domain/rules/timeline-viewport.rules'
import { plannedVsActualToday } from '../../domain/rules/progress-tracking.rules'
import { useTimelineDraft } from './useTimelineDraft'
import type { TimelineFlatRow } from '../../domain/model/timeline'

export function useCellTimeline(projectId: string | null) {
  const gantt = useProjectGantt(projectId, { includeUnscheduled: true })
  const tasksHook = useProjectTasks(projectId, { page: 0, size: 500 })
  const phasesHook = useProjectPhases(projectId)

  const taskIds = useMemo(
    () => tasksHook.tasks.map((t) => t.id),
    [tasksHook.tasks]
  )
  const progress = useTaskProgressSnapshots(projectId, taskIds)
  const allocations = useTaskAllocations(projectId)

  const [mode, setMode] = useState<Mode>(TimelineMode.Timeline)
  const [metric, setMetric] = useState<Metric>(TimelineMetric.Schedule)
  const [granularity, setGranularity] = useState<Granularity>(TimelineGranularity.Week)
  const [hideUnscheduled, setHideUnscheduled] = useState(false)
  const [collapsedPhaseIds, setCollapsedPhaseIds] = useState<Set<string>>(() => new Set())
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [focusedPhaseRowId, setFocusedPhaseRowId] = useState<string | null>(null)

  const initialViewport = useMemo(
    () => resolveTimelineViewport(gantt.items),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gantt.items]
  )
  const [viewport, setViewport] = useState<{ start: string; end: string } | null>(null)
  const effectiveViewport = viewport ?? initialViewport

  const draftApi = useTimelineDraft()

  const taskById = useMemo(() => {
    const map = new Map<string, TaskEnrichment>()
    for (const t of tasksHook.tasks) {
      const ganttItem = gantt.items.find(
        (i) => i.sourceEntityId === t.id && i.itemType === 'TASK'
      )
      const vs = plannedVsActualToday({
        startDate: ganttItem?.startDate ?? t.plannedStartDate,
        endDate: ganttItem?.endDate ?? t.dueDate,
        estimateHours: t.estimateHours,
        snapshots: progress.snapshots,
        taskId: t.id,
      })
      map.set(t.id, {
        estimateHours: t.estimateHours,
        status: String(t.status),
        inChargeUserId: t.inChargeUserId,
        progressPercent: vs.actual,
        atRisk: vs.atRisk,
      })
    }
    return map
  }, [tasksHook.tasks, progress.snapshots, gantt.items])

  const phaseById = useMemo(() => {
    const map = new Map<string, PhaseEnrichment>()
    for (const p of phasesHook.phases) {
      map.set(p.id, {
        code: p.code,
        name: p.name,
        status: String(p.status),
        statusLabel: phaseWatchStatusLabel(String(p.status)),
        description: p.description,
      })
    }
    return map
  }, [phasesHook.phases])

  const baseRows = useMemo(
    () =>
      flattenTimelineRows(gantt.tree, {
        collapsedPhaseIds,
        hideUnscheduled,
        taskById,
        phaseById,
        includeAddRows: true,
      }),
    [gantt.tree, collapsedPhaseIds, hideUnscheduled, taskById, phaseById]
  )

  const draftDateMap = useMemo(() => {
    const m = new Map<string, { startDate: string; endDate: string }>()
    for (const [id, v] of draftApi.draft) {
      m.set(id, { startDate: v.startDate, endDate: v.endDate })
    }
    return m
  }, [draftApi.draft])

  const allRows = useMemo(
    () => applyDraftToRows(baseRows, draftDateMap),
    [baseRows, draftDateMap]
  )

  const rows = useMemo(() => {
    if (!focusedPhaseRowId) return allRows
    return filterRowsToFocusedPhase(allRows, focusedPhaseRowId)
  }, [allRows, focusedPhaseRowId])

  const phaseRows = useMemo(
    () => allRows.filter((r): r is TimelineFlatRow => r.kind === 'phase' && r.itemType === 'PHASE'),
    [allRows]
  )

  const columns = useMemo(
    () => buildTimelineColumns(effectiveViewport.start, effectiveViewport.end, granularity),
    [effectiveViewport.start, effectiveViewport.end, granularity]
  )

  const colWidth = cellWidthPx(granularity)

  const unscheduledTasks = useMemo(
    () =>
      allRows.filter(
        (r) => r.kind === 'task' && !r.startDate && !r.endDate
      ),
    [allRows]
  )

  const scheduledTaskCount = useMemo(
    () =>
      allRows.filter(
        (r) => r.kind === 'task' && Boolean(r.startDate && r.endDate)
      ).length,
    [allRows]
  )

  const taskItemCount = useMemo(
    () => allRows.filter((r) => r.kind === 'task' || r.kind === 'milestone').length,
    [allRows]
  )

  const atRiskCount = useMemo(
    () => allRows.filter((r) => r.kind === 'task' && r.atRisk).length,
    [allRows]
  )

  const togglePhase = useCallback((phaseRowId: string) => {
    setCollapsedPhaseIds((prev) => {
      const next = new Set(prev)
      if (next.has(phaseRowId)) next.delete(phaseRowId)
      else next.add(phaseRowId)
      return next
    })
  }, [])

  const expandPhase = useCallback((phaseRowId: string) => {
    setCollapsedPhaseIds((prev) => {
      if (!prev.has(phaseRowId)) return prev
      const next = new Set(prev)
      next.delete(phaseRowId)
      return next
    })
  }, [])

  const collapseOtherPhases = useCallback((keepPhaseRowId: string) => {
    setCollapsedPhaseIds(() => {
      const next = new Set<string>()
      for (const row of allRows) {
        if (row.kind === 'phase' && row.id !== keepPhaseRowId) next.add(row.id)
      }
      return next
    })
  }, [allRows])

  const fitToProject = useCallback(() => {
    const vp = resolveTimelineViewport(gantt.items, { padDays: 3 })
    setViewport(vp)
    setGranularity(pickFitGranularity(vp.start, vp.end))
  }, [gantt.items])

  const fitToPhase = useCallback(
    (phase: Pick<TimelineFlatRow, 'startDate' | 'endDate'>) => {
      if (!phase.startDate || !phase.endDate) {
        fitToProject()
        return
      }
      const pad = 2
      const start = new Date(`${phase.startDate}T12:00:00`)
      start.setDate(start.getDate() - pad)
      const end = new Date(`${phase.endDate}T12:00:00`)
      end.setDate(end.getDate() + pad)
      const vp = {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      }
      setViewport(vp)
      setGranularity(pickFitGranularity(vp.start, vp.end))
    },
    [fitToProject]
  )

  const jumpToToday = useCallback(() => {
    setViewport(viewportAroundToday(granularity === TimelineGranularity.Day ? 21 : 42))
  }, [granularity])

  const focusPhase = useCallback(
    (phaseRowId: string) => {
      expandPhase(phaseRowId)
      setFocusedPhaseRowId(phaseRowId)
      const phase = allRows.find((r) => r.id === phaseRowId)
      if (phase) fitToPhase(phase)
    },
    [allRows, expandPhase, fitToPhase]
  )

  const exitFocus = useCallback(() => {
    setFocusedPhaseRowId(null)
  }, [])

  const criticalTaskIds = useMemo(() => {
    const path = Array.isArray(gantt.criticalPath) ? gantt.criticalPath : []
    return new Set(path.map((c) => c.taskId))
  }, [gantt.criticalPath])

  const applyChanges = useCallback(async () => {
    const patches = draftApi.dirtyPatches()
    for (const p of patches) {
      await gantt.moveTask(
        p.sourceTaskId,
        {
          manualStartDate: p.startDate,
          manualFinishDate: p.endDate,
          reason: 'Cell timeline planning',
          recalculate: false,
        },
        { refresh: false }
      )
    }
    draftApi.clear()
    await gantt.refetch()
    await tasksHook.refetch()
  }, [draftApi, gantt, tasksHook])

  return {
    ...gantt,
    tasksLoading: tasksHook.loading,
    createTask: tasksHook.createTask,
    updateTask: tasksHook.updateTask,
    getTask: tasksHook.getTask,
    runLifecycle: tasksHook.runLifecycle,
    mode,
    setMode,
    metric,
    setMetric,
    granularity,
    setGranularity,
    hideUnscheduled,
    setHideUnscheduled,
    selectedRowId,
    setSelectedRowId,
    viewport: effectiveViewport,
    setViewport,
    columns,
    colWidth,
    rows,
    allRows,
    phaseRows,
    phases: phasesHook.phases,
    unscheduledTasks,
    scheduledTaskCount,
    taskItemCount,
    atRiskCount,
    togglePhase,
    expandPhase,
    collapseOtherPhases,
    focusedPhaseRowId,
    focusPhase,
    exitFocus,
    fitToProject,
    fitToPhase,
    jumpToToday,
    draft: draftApi,
    applyChanges,
    progressSnapshots: progress.snapshots,
    progressSource: progress.source,
    recordProgress: progress.recordProgress,
    allocationsByTaskId: allocations.byTaskId,
    saveAllocation: allocations.saveAllocation,
    clearAllocation: allocations.clearAllocation,
    baseline: allocations.baseline,
    captureBaseline: allocations.captureBaseline,
    criticalTaskIds,
    addDependency: gantt.addDependency,
    removeDependency: gantt.removeDependency,
    recalculate: gantt.recalculate,
    recalculating: gantt.recalculating,
    loadCriticalPath: gantt.loadCriticalPath,
  }
}
