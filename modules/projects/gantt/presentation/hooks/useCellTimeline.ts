'use client'

import { useCallback, useMemo, useState } from 'react'
import { useProjectGantt } from './useProjectGantt'
import { useProjectTasks } from '../../../task/presentation/hooks/useProjectTasks'
import { useProjectPhases } from '../../../phase/presentation/hooks/useProjectPhases'
import { useProjectWbs } from '../../../wbs/presentation/hooks/useProjectWbs'
import * as projectsApi from '../../../project/api/projects.api'
import { phaseWatchStatusLabel } from '../../../phase/domain/rules/phase-watch.rules'
import type { WbsTreeNode } from '../../../wbs/domain/model/wbs'
import { useTaskProgressSnapshots } from './useTaskProgressSnapshots'
import { useTaskAllocations } from './useTaskAllocations'
import {
  TimelineCollapseMode,
  TimelineGranularity,
  TimelineMetric,
  TimelineMode,
} from '../../domain/enums/timeline.enum'
import type {
  TimelineCollapseMode as CollapseMode,
  TimelineGranularity as Granularity,
  TimelineMetric as Metric,
  TimelineMode as Mode,
} from '../../domain/enums/timeline.enum'
import { buildTimelineColumns, cellWidthPx } from '../../domain/rules/timeline-buckets.rules'
import {
  applyDraftToRows,
  collectProjectCollapseIds,
  filterRowsToFocusedPhase,
  flattenTimelineRows,
  type PhaseEnrichment,
  type TaskEnrichment,
  type WbsEnrichment,
} from '../../domain/rules/timeline-rows.rules'
import {
  ensureDateInViewport,
  ensureTodayInViewport,
  pickFitGranularity,
  resolveTimelineViewport,
} from '../../domain/rules/timeline-viewport.rules'
import { plannedVsActualToday } from '../../domain/rules/progress-tracking.rules'
import {
  buildGanttTree,
  collectDescendantScheduledTasks,
  repairGanttWbsParents,
} from '../../domain/rules/gantt.rules'
import { parseLocalDate, shiftDateRange } from '../../domain/rules/working-calendar.rules'
import { useTimelineDraft } from './useTimelineDraft'
import type {
  TimelineContainerEditValues,
  TimelineFlatRow,
} from '../../domain/model/timeline'

export function useCellTimeline(projectId: string | null) {
  const gantt = useProjectGantt(projectId, { includeUnscheduled: true })
  const tasksHook = useProjectTasks(projectId, { page: 0, size: 500 })
  const phasesHook = useProjectPhases(projectId)
  const wbsHook = useProjectWbs(projectId)

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
  const [collapseMode, setCollapseModeState] = useState<CollapseMode>(
    TimelineCollapseMode.Expand
  )
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

  const wbsById = useMemo(() => {
    const map = new Map<string, WbsEnrichment>()
    const visit = (nodes: WbsTreeNode[]) => {
      for (const n of nodes) {
        map.set(n.id, {
          description: n.description ?? null,
          code: n.code ?? null,
          nodeType: n.nodeType ?? null,
          title: n.title ?? null,
          plannedStartDate: n.plannedStartDate ?? null,
          plannedEndDate: n.plannedEndDate ?? null,
        })
        if (n.children.length) visit(n.children)
      }
    }
    visit(wbsHook.tree)
    return map
  }, [wbsHook.tree])

  /** parentId / phaseId from Plan Structure — used to nest WBS rows correctly on Timeline. */
  const wbsParentById = useMemo(() => {
    const map = new Map<string, { parentId: string | null; phaseId: string | null }>()
    const visit = (nodes: WbsTreeNode[]) => {
      for (const n of nodes) {
        map.set(n.id, {
          parentId: n.parentId ?? null,
          phaseId: n.projectPhaseId ?? null,
        })
        if (n.children.length) visit(n.children)
      }
    }
    visit(wbsHook.tree)
    return map
  }, [wbsHook.tree])

  const timelineTree = useMemo(
    () => buildGanttTree(repairGanttWbsParents(gantt.items, wbsParentById)),
    [gantt.items, wbsParentById]
  )

  const hideTaskRows = collapseMode === TimelineCollapseMode.Structure

  const baseRows = useMemo(
    () =>
      flattenTimelineRows(timelineTree, {
        collapsedPhaseIds,
        hideUnscheduled,
        taskById,
        phaseById,
        wbsById,
        includeAddRows: true,
        hideTaskRows,
      }),
    [
      timelineTree,
      collapsedPhaseIds,
      hideUnscheduled,
      taskById,
      phaseById,
      wbsById,
      hideTaskRows,
    ]
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

  const groupRowIds = useMemo(
    () => allRows.filter((r) => r.kind === 'phase').map((r) => r.id),
    [allRows]
  )

  const hasCollapsedGroups = useMemo(
    () => groupRowIds.some((id) => collapsedPhaseIds.has(id)),
    [groupRowIds, collapsedPhaseIds]
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

  const setCollapseMode = useCallback(
    (next: CollapseMode) => {
      setCollapseModeState(next)
      if (next === TimelineCollapseMode.Project) {
        setCollapsedPhaseIds(collectProjectCollapseIds(timelineTree))
      } else {
        // EXPAND + STRUCTURE start with groups open; STRUCTURE hides leaves via hideTaskRows.
        setCollapsedPhaseIds(new Set())
      }
    },
    [timelineTree]
  )

  const expandAll = useCallback(() => {
    setCollapseMode(TimelineCollapseMode.Expand)
  }, [setCollapseMode])

  const collapseAll = useCallback(() => {
    setCollapseMode(TimelineCollapseMode.Project)
  }, [setCollapseMode])

  const collapseOtherPhases = useCallback((keepPhaseRowId: string) => {
    setCollapsedPhaseIds(() => {
      const next = new Set<string>()
      for (const row of allRows) {
        if (row.kind === 'phase' && row.id !== keepPhaseRowId) next.add(row.id)
      }
      return next
    })
  }, [allRows])

  const fitToProject = useCallback(
    (opts?: { adjustGranularity?: boolean }) => {
      const vp = resolveTimelineViewport(gantt.items, { padDays: 3 })
      setViewport(vp)
      // Default zoom stays Week; only Fit menu actions may auto-pick granularity.
      if (opts?.adjustGranularity) {
        setGranularity(pickFitGranularity(vp.start, vp.end))
      }
    },
    [gantt.items]
  )

  const fitToPhase = useCallback(
    (
      phase: Pick<TimelineFlatRow, 'startDate' | 'endDate'>,
      opts?: { adjustGranularity?: boolean }
    ) => {
      if (!phase.startDate || !phase.endDate) {
        fitToProject(opts)
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
      if (opts?.adjustGranularity) {
        setGranularity(pickFitGranularity(vp.start, vp.end))
      }
    },
    [fitToProject]
  )

  /** Keep the full plan range; only expand if today sits outside the current window. */
  const ensureTodayVisible = useCallback(() => {
    setViewport((prev) => ensureTodayInViewport(prev ?? initialViewport))
  }, [initialViewport])

  /** Expand viewport if needed so `date` is included — never shrinks the plan range. */
  const ensureDateVisible = useCallback(
    (date: string) => {
      setViewport((prev) => ensureDateInViewport(prev ?? initialViewport, date))
    },
    [initialViewport]
  )

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

  const shiftDescendantTasks = useCallback(
    async (rowId: string, oldStart: string | null, newStart: string) => {
      if (!oldStart || oldStart === newStart) return 0
      const from = parseLocalDate(oldStart)
      const to = parseLocalDate(newStart)
      if (!from || !to) return 0
      const deltaDays = Math.round((to.getTime() - from.getTime()) / 86400000)
      if (deltaDays === 0) return 0
      const descendants = collectDescendantScheduledTasks(timelineTree, rowId)
      for (const d of descendants) {
        const next = shiftDateRange(d.startDate, d.endDate, deltaDays)
        await gantt.moveTask(
          d.taskId,
          {
            manualStartDate: next.start,
            manualFinishDate: next.end,
            reason: 'Timeline container date edit',
            recalculate: false,
          },
          { refresh: false }
        )
      }
      return descendants.length
    },
    [gantt, timelineTree]
  )

  const applyChanges = useCallback(async (): Promise<{ skippedWbs: number }> => {
    const patches = draftApi.dirtyPatches()
    const rowById = new Map(allRows.map((r) => [r.id, r]))
    const baseById = new Map(baseRows.map((r) => [r.id, r]))
    const patchedSourceIds = new Set(
      patches
        .map((p) => rowById.get(p.itemId))
        .filter((row) => row?.kind === 'task' || row?.kind === 'milestone')
        .map((row) => row?.sourceEntityId)
        .filter((id): id is string => Boolean(id))
    )
    const containerHasTaskPatches = (rowId: string) =>
      collectDescendantScheduledTasks(timelineTree, rowId).some((d) =>
        patchedSourceIds.has(d.taskId)
      )
    let skippedWbs = 0
    for (const p of patches) {
      const row = rowById.get(p.itemId)
      const base = baseById.get(p.itemId)
      const itemType = row?.itemType
      if (itemType === 'PHASE') {
        if (base?.startDate && !containerHasTaskPatches(p.itemId)) {
          await shiftDescendantTasks(p.itemId, base.startDate, p.startDate)
        }
        const phaseId = row?.sourceEntityId ?? p.sourceTaskId
        const phase = phasesHook.phases.find((ph) => ph.id === phaseId)
        await phasesHook.updatePhase(phaseId, {
          name: phase?.name || row?.title || row?.displayPrimary,
          displayOrder: phase?.displayOrder,
          description: phase?.description ?? row?.phaseDescription ?? null,
          plannedStartDate: p.startDate,
          plannedEndDate: p.endDate,
        })
        continue
      }
      if (itemType === 'PROJECT' && projectId) {
        if (base?.startDate && !containerHasTaskPatches(p.itemId)) {
          await shiftDescendantTasks(p.itemId, base.startDate, p.startDate)
        }
        await projectsApi.updateProject(projectId, {
          plannedStartDate: p.startDate,
          plannedEndDate: p.endDate,
        })
        continue
      }
      if (itemType === 'WBS_NODE') {
        if (
          base?.startDate &&
          p.startDate !== base.startDate &&
          !containerHasTaskPatches(p.itemId)
        ) {
          await shiftDescendantTasks(p.itemId, base.startDate, p.startDate)
        }
        if (row?.sourceEntityId) {
          await wbsHook.updateNode(row.sourceEntityId, {
            title: row.displayPrimary || row.title,
            description: row.phaseDescription ?? null,
            nodeType: row.wbsNodeType || 'WORK_PACKAGE',
            plannedStartDate: p.startDate,
            plannedEndDate: p.endDate,
          })
        } else {
          skippedWbs += 1
        }
        continue
      }
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
    // Silent refresh keeps the board mounted so scroll position is preserved.
    await gantt.refetch({ silent: true })
    await tasksHook.refetch()
    await phasesHook.refetch({ silent: true })
    await wbsHook.refetch()
    return { skippedWbs }
  }, [
    draftApi,
    gantt,
    tasksHook,
    phasesHook,
    wbsHook,
    allRows,
    baseRows,
    projectId,
    shiftDescendantTasks,
    timelineTree,
  ])

  const updateContainerDetails = useCallback(
    async (row: TimelineFlatRow, values: TimelineContainerEditValues) => {
      if (!row.sourceEntityId && row.itemType !== 'PROJECT') {
        return { shiftedTasks: 0, updated: false as const }
      }

      const startDate = values.startDate || null
      const endDate = values.endDate || null
      let shiftedTasks = 0

      if (startDate && row.startDate && startDate !== row.startDate) {
        shiftedTasks = await shiftDescendantTasks(row.id, row.startDate, startDate)
      }

      if (row.itemType === 'PHASE' && row.sourceEntityId) {
        const phase = phasesHook.phases.find((ph) => ph.id === row.sourceEntityId)
        await phasesHook.updatePhase(row.sourceEntityId, {
          name: values.title.trim() || phase?.name || row.title || row.displayPrimary,
          displayOrder: phase?.displayOrder,
          description: values.description || null,
          plannedStartDate: startDate,
          plannedEndDate: endDate,
        })
      } else if (row.itemType === 'WBS_NODE' && row.sourceEntityId) {
        await wbsHook.updateNode(row.sourceEntityId, {
          title: values.title,
          description: values.description || null,
          nodeType: values.nodeType || row.wbsNodeType || 'WORK_PACKAGE',
          plannedStartDate: startDate,
          plannedEndDate: endDate,
        })
      } else if (row.itemType === 'PROJECT' && projectId) {
        await projectsApi.updateProject(projectId, {
          name: values.title,
          description: values.description || null,
          plannedStartDate: startDate,
          plannedEndDate: endDate,
        })
      } else {
        return { shiftedTasks: 0, updated: false as const }
      }

      // Drop stale local drafts so they don't overlay the persisted schedule.
      draftApi.clearItems([row.id])

      await wbsHook.refetch()
      await gantt.refetch({ silent: true })
      await phasesHook.refetch({ silent: true })
      return { shiftedTasks, updated: true as const }
    },
    [shiftDescendantTasks, phasesHook, wbsHook, gantt, projectId, draftApi]
  )

  const updateContainerDates = useCallback(
    async (
      row: Pick<TimelineFlatRow, 'id' | 'itemType' | 'sourceEntityId' | 'startDate'>,
      body: { startDate: string; endDate: string }
    ) => {
      const full = allRows.find((r) => r.id === row.id)
      if (!full) {
        if (row.itemType === 'PHASE' && row.sourceEntityId) {
          await phasesHook.updatePhase(row.sourceEntityId, {
            plannedStartDate: body.startDate,
            plannedEndDate: body.endDate,
          })
          await gantt.refetch({ silent: true })
        }
        return
      }
      await updateContainerDetails(full, {
        title: full.displayPrimary,
        description: full.phaseDescription ?? '',
        startDate: body.startDate,
        endDate: body.endDate,
        nodeType: full.wbsNodeType ?? undefined,
      })
    },
    [allRows, updateContainerDetails, phasesHook, gantt]
  )

  const createPhase = useCallback(
    async (body: Parameters<typeof phasesHook.createPhase>[0]) => {
      const created = await phasesHook.createPhase(body)
      await gantt.refetch()
      return created
    },
    [phasesHook, gantt]
  )

  const createWbsNode = useCallback(
    async (body: Parameters<typeof wbsHook.createNode>[0]) => {
      await wbsHook.createNode(body)
      await gantt.refetch()
    },
    [wbsHook, gantt]
  )

  const refetchAll = useCallback(async () => {
    await Promise.all([
      gantt.refetch(),
      tasksHook.refetch(),
      phasesHook.refetch(),
      wbsHook.refetch(),
    ])
  }, [gantt, tasksHook, phasesHook, wbsHook])

  return {
    ...gantt,
    tasks: tasksHook.tasks,
    tasksLoading: tasksHook.loading,
    createTask: tasksHook.createTask,
    createPhase,
    createWbsNode,
    updateTask: tasksHook.updateTask,
    assignTask: tasksHook.assignTask,
    getTask: tasksHook.getTask,
    runLifecycle: tasksHook.runLifecycle,
    refetchAll,
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
    expandAll,
    collapseAll,
    hasCollapsedGroups,
    collapseMode,
    setCollapseMode,
    collapseOtherPhases,
    updateContainerDates,
    updateContainerDetails,
    focusedPhaseRowId,
    focusPhase,
    exitFocus,
    fitToProject,
    fitToPhase,
    ensureTodayVisible,
    ensureDateVisible,
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
    ganttDependencies: gantt.ganttDependencies,
    issues: gantt.issues,
    addDependency: gantt.addDependency,
    removeDependency: gantt.removeDependency,
    recalculate: gantt.recalculate,
    recalculating: gantt.recalculating,
    loadCriticalPath: gantt.loadCriticalPath,
  }
}
