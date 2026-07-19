'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as scheduleApi from '../../infrastructure/api/schedule.api'
import type {
  CreateScheduleRunPayload,
  DailyWorkEntry,
  DailyWorkParams,
  ScheduleIssue,
  ScheduleRun,
  TaskSchedule,
  TaskScheduleDetail,
} from '../../domain/model/schedule'

export function useProjectSchedule(projectId: string | null) {
  const [runs, setRuns] = useState<ScheduleRun[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleRun | null>(null)
  const [currentTasks, setCurrentTasks] = useState<TaskSchedule[]>([])
  const [dailyWork, setDailyWork] = useState<DailyWorkEntry[]>([])
  const [scheduleIssues, setScheduleIssues] = useState<ScheduleIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const runsRes = await scheduleApi.listScheduleRuns(projectId)
      setRuns(runsRes ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load schedule runs')
      setRuns([])
    } finally {
      setLoading(false)
    }

    try {
      const [current, tasks, dw, si] = await Promise.all([
        scheduleApi.getCurrentSchedule(projectId),
        scheduleApi.getCurrentScheduleTasks(projectId),
        scheduleApi.getCurrentScheduleDailyWork(projectId).catch(() => []),
        scheduleApi.getCurrentScheduleIssues(projectId).catch(() => []),
      ])
      setCurrentSchedule(current)
      setCurrentTasks(tasks ?? [])
      setDailyWork(dw ?? [])
      setScheduleIssues(si ?? [])
    } catch {
      // No current schedule run yet — not a fatal error for the page.
      setCurrentSchedule(null)
      setCurrentTasks([])
      setDailyWork([])
      setScheduleIssues([])
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createRun = useCallback(
    async (body: CreateScheduleRunPayload) => {
      if (!projectId) return null
      setCreating(true)
      try {
        const created = await scheduleApi.createScheduleRun(projectId, body)
        await load()
        return created
      } finally {
        setCreating(false)
      }
    },
    [projectId, load]
  )

  const cancelRun = useCallback(
    async (scheduleRunId: string) => {
      if (!projectId) return null
      const result = await scheduleApi.cancelScheduleRun(projectId, scheduleRunId)
      await load()
      return result
    },
    [projectId, load]
  )

  const loadTaskSchedule = useCallback(
    async (taskId: string): Promise<TaskScheduleDetail | null> => {
      if (!projectId) return null
      return scheduleApi.getTaskSchedule(projectId, taskId)
    },
    [projectId]
  )

  const loadTaskScheduleHistory = useCallback(
    async (taskId: string): Promise<TaskScheduleDetail[]> => {
      if (!projectId) return []
      return scheduleApi.getTaskScheduleHistory(projectId, taskId)
    },
    [projectId]
  )

  const loadDailyWork = useCallback(
    async (params?: DailyWorkParams) => {
      if (!projectId) return
      const dw = await scheduleApi.getCurrentScheduleDailyWork(projectId, params)
      setDailyWork(dw ?? [])
    },
    [projectId]
  )

  return {
    runs,
    currentSchedule,
    currentTasks,
    dailyWork,
    scheduleIssues,
    loading,
    creating,
    error,
    forbidden,
    refetch: load,
    createRun,
    cancelRun,
    loadTaskSchedule,
    loadTaskScheduleHistory,
    loadDailyWork,
  }
}
