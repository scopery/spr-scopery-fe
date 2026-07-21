'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as ganttApi from '../../infrastructure/api/gantt.api'
import {
  buildGanttTree,
  computeGanttDateRange,
} from '../../domain/rules/gantt.rules'
import type {
  CreateGanttDependencyPayload,
  CriticalPathItem,
  GanttDependency,
  GanttIssue,
  GanttView,
  GanttViewParams,
  MoveGanttTaskPayload,
  RecalculateGanttPayload,
  ResizeGanttTaskPayload,
} from '../../domain/model/gantt'

export function useProjectGantt(projectId: string | null, params?: GanttViewParams) {
  const [view, setView] = useState<GanttView | null>(null)
  const [ganttDependencies, setGanttDependencies] = useState<GanttDependency[]>([])
  const [issues, setIssues] = useState<GanttIssue[]>([])
  const [criticalPath, setCriticalPath] = useState<CriticalPathItem[]>([])
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const paramsKey = JSON.stringify(params ?? {})

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [ganttView, deps, ganttIssues] = await Promise.all([
        ganttApi.getGanttView(projectId, params),
        ganttApi.getGanttDependencies(projectId).catch(() => []),
        ganttApi.getGanttIssues(projectId).catch(() => []),
      ])
      setView(ganttView)
      setGanttDependencies(deps)
      setIssues(ganttIssues)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load timeline')
      setView(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paramsKey captures params
  }, [projectId, paramsKey])

  useEffect(() => {
    void load()
  }, [load])

  const items = useMemo(() => view?.items ?? [], [view])
  const tree = useMemo(() => buildGanttTree(items), [items])
  const dateRange = useMemo(() => computeGanttDateRange(items), [items])

  const recalculate = useCallback(
    async (body: RecalculateGanttPayload = { markAsCurrent: true }) => {
      if (!projectId) return
      setRecalculating(true)
      try {
        const next = await ganttApi.recalculateGantt(projectId, body)
        setView(next)
      } finally {
        setRecalculating(false)
      }
    },
    [projectId]
  )

  const moveTask = useCallback(
    async (taskId: string, body: MoveGanttTaskPayload) => {
      if (!projectId) return
      await ganttApi.moveGanttTask(projectId, taskId, body)
      await load()
    },
    [projectId, load]
  )

  const resizeTask = useCallback(
    async (taskId: string, body: ResizeGanttTaskPayload) => {
      if (!projectId) return
      await ganttApi.resizeGanttTask(projectId, taskId, body)
      await load()
    },
    [projectId, load]
  )

  const clearOverride = useCallback(
    async (taskId: string) => {
      if (!projectId) return
      await ganttApi.clearGanttOverride(projectId, taskId)
      await load()
    },
    [projectId, load]
  )

  const addDependency = useCallback(
    async (body: CreateGanttDependencyPayload) => {
      if (!projectId) return null
      const created = await ganttApi.createGanttDependency(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const removeDependency = useCallback(
    async (depId: string) => {
      if (!projectId) return
      await ganttApi.deleteGanttDependency(projectId, depId)
      await load()
    },
    [projectId, load]
  )

  const loadCriticalPath = useCallback(async () => {
    if (!projectId) return
    const cp = await ganttApi.getCriticalPath(projectId)
    setCriticalPath(cp ?? [])
  }, [projectId])

  return {
    view,
    items,
    tree,
    dateRange,
    summary: view?.summary,
    ganttDependencies,
    issues,
    criticalPath,
    loading,
    recalculating,
    error,
    forbidden,
    refetch: load,
    recalculate,
    moveTask,
    resizeTask,
    clearOverride,
    addDependency,
    removeDependency,
    loadCriticalPath,
  }
}
