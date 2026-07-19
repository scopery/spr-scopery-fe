'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as estimationApi from '../../infrastructure/api/estimation.api'
import { isEstimationRunning } from '../../domain/rules/estimation.rules'
import type {
  EstimationRun,
  PhaseEstimateRollup,
  PreviewRateImpactPayload,
  ProjectEstimateSummary,
  TaskEstimateSnapshot,
  TaskRatePreview,
  WbsEstimateRollup,
} from '../../domain/model/estimation'

export type EstimationRunDetailTab =
  | 'summary'
  | 'tasks'
  | 'wbs'
  | 'phase'
  | 'issues'
  | 'assumptions'

export type TaskIssueFilter =
  | 'all'
  | 'unresolved_role'
  | 'unresolved_rate'
  | 'unestimated'
  | 'excluded'

const POLL_MS = 3000

export function useEstimationRunDetail(
  projectId: string | null,
  runId: string | null
) {
  const [tab, setTab] = useState<EstimationRunDetailTab>('summary')
  const [taskFilter, setTaskFilter] = useState<TaskIssueFilter>('all')
  const [run, setRun] = useState<EstimationRun | null>(null)
  const [summary, setSummary] = useState<ProjectEstimateSummary | null>(null)
  const [tasks, setTasks] = useState<TaskEstimateSnapshot[]>([])
  const [wbsRollups, setWbsRollups] = useState<WbsEstimateRollup[]>([])
  const [phaseRollups, setPhaseRollups] = useState<PhaseEstimateRollup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !runId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const runRes = await estimationApi.getEstimationRun(projectId, runId)
      setRun(runRes)

      if (runRes.status === 'COMPLETED') {
        const [sum, taskList, wbs, phase] = await Promise.all([
          estimationApi.getEstimationRunSummary(projectId, runId),
          estimationApi.listEstimationRunTasks(projectId, runId),
          estimationApi.listEstimationWbsRollups(projectId, runId),
          estimationApi.listEstimationPhaseRollups(projectId, runId),
        ])
        setSummary(sum)
        setTasks(taskList)
        setWbsRollups(wbs)
        setPhaseRollups(phase)
      } else {
        setSummary(null)
        setTasks([])
        setWbsRollups([])
        setPhaseRollups([])
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load estimation run')
      setRun(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, runId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!projectId || !runId || !run || !isEstimationRunning(run)) return
    const id = setInterval(() => {
      void load()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [projectId, runId, run, load])

  const cancelRun = useCallback(async () => {
    if (!projectId || !runId) return null
    const result = await estimationApi.cancelEstimationRun(projectId, runId)
    await load()
    return result
  }, [projectId, runId, load])

  const markCurrent = useCallback(async () => {
    if (!projectId || !runId) return null
    const result = await estimationApi.markEstimationCurrent(projectId, runId)
    await load()
    return result
  }, [projectId, runId, load])

  const previewRate = useCallback(
    async (body: PreviewRateImpactPayload): Promise<TaskRatePreview | null> => {
      if (!projectId) return null
      return estimationApi.previewRateImpact(projectId, body)
    },
    [projectId]
  )

  const filteredTasks = tasks.filter((t) => {
    switch (taskFilter) {
      case 'unresolved_role':
        return t.status === 'UNRESOLVED_ROLE'
      case 'unresolved_rate':
        return t.status === 'UNRESOLVED_RATE'
      case 'unestimated':
        return t.estimateHours == null || t.estimateHours === 0
      case 'excluded':
        return t.status === 'EXCLUDED'
      default:
        return true
    }
  })

  const issueTasks = tasks.filter(
    (t) =>
      t.status === 'UNRESOLVED_ROLE' ||
      t.status === 'UNRESOLVED_RATE' ||
      t.issueCode != null
  )

  return {
    tab,
    setTab,
    taskFilter,
    setTaskFilter,
    run,
    summary,
    tasks: filteredTasks,
    allTasks: tasks,
    issueTasks,
    wbsRollups,
    phaseRollups,
    loading,
    error,
    forbidden,
    refetch: load,
    cancelRun,
    markCurrent,
    previewRate,
  }
}
