'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProjectStatus } from '../../../project/domain/enums/project.enum'
import * as phasesApi from '../../infrastructure/api/phases.api'
import * as tasksApi from '../../../task/infrastructure/api/tasks.api'
import { useProjects } from '../../../project/hooks/useProjects'
import {
  buildProjectPhaseWatchRow,
  filterPhaseWatchRows,
  sortPhaseWatchRows,
} from '../../domain/rules/phase-watch.rules'
import { PhaseWatchFollowUpKind } from '../../domain/enums/phase-watch.enum'
import type { PhaseWatchProjectRow } from '../../domain/model/phase-watch'

const MAX_PROJECTS = 40

function todayIsoDate() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function isWatchableProjectStatus(status: string) {
  return (
    status !== ProjectStatus.Archived &&
    status !== ProjectStatus.Completed
  )
}

export function usePhaseWatch(
  workspaceId: string | null,
  options?: { projectId?: string | null; filter?: string }
) {
  const { projects, loading: projectsLoading, error: projectsError } = useProjects(workspaceId)
  const [rows, setRows] = useState<PhaseWatchProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const projectIdFilter = options?.projectId ?? null
  const filter = options?.filter ?? PhaseWatchFollowUpKind.All

  const targetProjects = useMemo(() => {
    let list = projects.filter((p) => isWatchableProjectStatus(p.status))
    if (projectIdFilter) list = list.filter((p) => p.id === projectIdFilter)
    return list.slice(0, MAX_PROJECTS)
  }, [projects, projectIdFilter])

  const load = useCallback(async () => {
    if (!workspaceId || targetProjects.length === 0) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    const todayIso = todayIsoDate()
    try {
      const settled = await Promise.all(
        targetProjects.map(async (project) => {
          const [phasesRes, tasksRes] = await Promise.all([
            phasesApi.listPhases(project.id, { page: 0, size: 100 }),
            tasksApi.listTasks(project.id, { page: 0, size: 200 }),
          ])
          return buildProjectPhaseWatchRow({
            projectId: project.id,
            projectName: project.name,
            projectCode: project.code,
            phases: phasesRes.items ?? [],
            tasks: tasksRes.items ?? [],
            todayIso,
          })
        })
      )
      setRows(sortPhaseWatchRows(settled))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Phase Watch')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, targetProjects])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRows = useMemo(
    () => filterPhaseWatchRows(rows, filter),
    [rows, filter]
  )

  return {
    rows: filteredRows,
    allRows: rows,
    loading: projectsLoading || loading,
    error: projectsError ?? error,
    refetch: load,
  }
}
