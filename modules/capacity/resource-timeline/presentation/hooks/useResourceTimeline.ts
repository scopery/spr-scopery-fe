'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  TimelineCollapseMode,
  TimelineGranularity,
  buildGanttTree,
  buildTimelineColumns,
  cellWidthPx,
  collectProjectCollapseIds,
  ensureDateInViewport,
  ensureTodayInViewport,
  flattenTimelineRows,
  ganttApi,
  resolveTimelineViewport,
  type GanttItem,
  type GanttTreeItem,
  type TaskEnrichment,
  type TimelineCollapseMode as CollapseMode,
  type TimelineGranularity as Granularity,
} from '@/modules/projects/gantt'
import { useProjects } from '@/modules/projects/project'
import { ProjectStatus } from '@/modules/projects/project/domain/enums/project.enum'
import { tasksApi } from '@/modules/projects/task'
import {
  RESOURCE_TIMELINE_FANOUT_CONCURRENCY,
  RESOURCE_TIMELINE_MAX_PROJECTS,
  filterAndPruneGanttTree,
  mapWithConcurrency,
} from '../../domain/rules/resource-timeline.rules'

function isWatchableProjectStatus(status: string) {
  return status !== ProjectStatus.Archived && status !== ProjectStatus.Completed
}

function collectLeafProjectIds(
  nodes: GanttTreeItem[],
  projectId: string,
  into: Map<string, string>
) {
  for (const node of nodes) {
    if (
      (node.itemType === 'TASK' || node.itemType === 'MILESTONE') &&
      node.sourceEntityId
    ) {
      into.set(node.sourceEntityId, projectId)
    }
    if (node.children.length) collectLeafProjectIds(node.children, projectId, into)
  }
}

export function useResourceTimeline(
  workspaceId: string | null,
  options: {
    selectedUserId: string | null
    includeUnassigned: boolean
  }
) {
  const { projects, loading: projectsLoading, error: projectsError } = useProjects(workspaceId)
  const [forest, setForest] = useState<GanttTreeItem[]>([])
  const [flatItems, setFlatItems] = useState<GanttItem[]>([])
  const [taskById, setTaskById] = useState<Map<string, TaskEnrichment>>(() => new Map())
  const [taskProjectBySourceId, setTaskProjectBySourceId] = useState<Map<string, string>>(
    () => new Map()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [granularity, setGranularity] = useState<Granularity>(TimelineGranularity.Week)
  const [collapseMode, setCollapseModeState] = useState<CollapseMode>(
    TimelineCollapseMode.Expand
  )
  const [collapsedPhaseIds, setCollapsedPhaseIds] = useState<Set<string>>(new Set())
  const [viewportOverride, setViewportOverride] = useState<{
    start: string
    end: string
  } | null>(null)

  const selectedUserId = options.selectedUserId
  const includeUnassigned = options.includeUnassigned

  const targetProjects = useMemo(
    () =>
      projects
        .filter((p) => isWatchableProjectStatus(p.status))
        .slice(0, RESOURCE_TIMELINE_MAX_PROJECTS),
    [projects]
  )

  const load = useCallback(async () => {
    if (!workspaceId || targetProjects.length === 0) {
      setForest([])
      setFlatItems([])
      setTaskById(new Map())
      setTaskProjectBySourceId(new Map())
      return
    }

    setLoading(true)
    setError(null)
    try {
      const settled = await mapWithConcurrency(
        targetProjects,
        RESOURCE_TIMELINE_FANOUT_CONCURRENCY,
        async (project) => {
          try {
            const [view, tasksRes] = await Promise.all([
              ganttApi.getGanttView(project.id, { includeUnscheduled: true }),
              tasksApi.listTasks(project.id, { page: 0, size: 500 }).catch(() => ({
                items: [] as Awaited<ReturnType<typeof tasksApi.listTasks>>['items'],
              })),
            ])
            const tree = buildGanttTree(view.items ?? [])
            const pruned = filterAndPruneGanttTree(
              tree,
              selectedUserId,
              includeUnassigned
            )
            const enrichment = new Map<string, TaskEnrichment>()
            for (const t of tasksRes.items ?? []) {
              enrichment.set(t.id, {
                estimateHours: t.estimateHours,
                status: String(t.status),
                inChargeUserId: t.inChargeUserId,
                progressPercent: null,
                atRisk: false,
                description: t.description,
              })
            }
            return {
              pruned,
              items: view.items ?? [],
              projectId: project.id,
              enrichment,
            }
          } catch {
            return {
              pruned: [] as GanttTreeItem[],
              items: [] as GanttItem[],
              projectId: project.id,
              enrichment: new Map<string, TaskEnrichment>(),
            }
          }
        }
      )

      const nextForest: GanttTreeItem[] = []
      const nextItems: GanttItem[] = []
      const nextTaskProjects = new Map<string, string>()
      const nextTaskById = new Map<string, TaskEnrichment>()

      for (const entry of settled) {
        nextForest.push(...entry.pruned)
        if (entry.pruned.length === 0) continue

        collectLeafProjectIds(entry.pruned, entry.projectId, nextTaskProjects)

        const keepIds = new Set<string>()
        const keepSourceIds = new Set<string>()
        const walk = (nodes: GanttTreeItem[]) => {
          for (const n of nodes) {
            keepIds.add(n.id)
            if (
              (n.itemType === 'TASK' || n.itemType === 'MILESTONE') &&
              n.sourceEntityId
            ) {
              keepSourceIds.add(n.sourceEntityId)
            }
            walk(n.children)
          }
        }
        walk(entry.pruned)

        for (const item of entry.items) {
          if (keepIds.has(item.id)) nextItems.push(item)
        }
        for (const sourceId of keepSourceIds) {
          const enrich = entry.enrichment.get(sourceId)
          if (enrich) nextTaskById.set(sourceId, enrich)
        }
      }

      setForest(nextForest)
      setFlatItems(nextItems)
      setTaskById(nextTaskById)
      setTaskProjectBySourceId(nextTaskProjects)
      setViewportOverride(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team schedule')
      setForest([])
      setFlatItems([])
      setTaskById(new Map())
      setTaskProjectBySourceId(new Map())
    } finally {
      setLoading(false)
    }
  }, [workspaceId, selectedUserId, includeUnassigned, targetProjects])

  useEffect(() => {
    void load()
  }, [load])

  const hideTaskRows = collapseMode === TimelineCollapseMode.Structure

  const rows = useMemo(
    () =>
      flattenTimelineRows(forest, {
        collapsedPhaseIds,
        hideUnscheduled: false,
        taskById,
        includeAddRows: false,
        hideTaskRows,
      }),
    [forest, collapsedPhaseIds, hideTaskRows, taskById]
  )

  const resolvedViewport = useMemo(
    () => resolveTimelineViewport(flatItems, { padDays: 7 }),
    [flatItems]
  )

  const effectiveViewport = viewportOverride ?? resolvedViewport

  const columns = useMemo(
    () =>
      buildTimelineColumns(
        effectiveViewport.start,
        effectiveViewport.end,
        granularity
      ),
    [effectiveViewport.start, effectiveViewport.end, granularity]
  )

  const colWidth = cellWidthPx(granularity)

  const setCollapseMode = useCallback(
    (next: CollapseMode) => {
      setCollapseModeState(next)
      if (next === TimelineCollapseMode.Project) {
        setCollapsedPhaseIds(collectProjectCollapseIds(forest))
      } else {
        setCollapsedPhaseIds(new Set())
      }
    },
    [forest]
  )

  useEffect(() => {
    if (collapseMode === TimelineCollapseMode.Project) {
      setCollapsedPhaseIds(collectProjectCollapseIds(forest))
    }
  }, [forest, collapseMode])

  const togglePhase = useCallback((phaseRowId: string) => {
    setCollapsedPhaseIds((prev) => {
      const next = new Set(prev)
      if (next.has(phaseRowId)) next.delete(phaseRowId)
      else next.add(phaseRowId)
      return next
    })
  }, [])

  const goToday = useCallback(() => {
    setViewportOverride((prev) =>
      ensureTodayInViewport(prev ?? resolvedViewport)
    )
  }, [resolvedViewport])

  const ensureDateVisible = useCallback(
    (date: string) => {
      setViewportOverride((prev) =>
        ensureDateInViewport(prev ?? resolvedViewport, date)
      )
    },
    [resolvedViewport]
  )

  const projectIdForTask = useCallback(
    (sourceEntityId: string | null | undefined) => {
      if (!sourceEntityId) return null
      return taskProjectBySourceId.get(sourceEntityId) ?? null
    },
    [taskProjectBySourceId]
  )

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects) map.set(p.id, p.name)
    return map
  }, [projects])

  const projectNameForTask = useCallback(
    (sourceEntityId: string | null | undefined) => {
      const projectId = projectIdForTask(sourceEntityId)
      if (!projectId) return null
      return projectNameById.get(projectId) ?? null
    },
    [projectIdForTask, projectNameById]
  )

  const projectCapReached =
    projects.filter((p) => isWatchableProjectStatus(p.status)).length >
    RESOURCE_TIMELINE_MAX_PROJECTS

  return {
    rows,
    columns,
    colWidth,
    granularity,
    setGranularity,
    collapseMode,
    setCollapseMode,
    togglePhase,
    collapsedPhaseIds,
    loading: projectsLoading || loading,
    error: projectsError ?? error,
    refetch: load,
    goToday,
    ensureDateVisible,
    projectIdForTask,
    projectNameForTask,
    effectiveViewport,
    projectCount: targetProjects.length,
    projectCapReached,
    maxProjects: RESOURCE_TIMELINE_MAX_PROJECTS,
    hasData: forest.length > 0,
  }
}
