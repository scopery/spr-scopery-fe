import { apiPath } from '@/shared/lib/api-paths'
import type { TaskScheduleParams } from '../../domain/model/schedule'

function buildQuery(params?: TaskScheduleParams): string {
  if (!params) return ''
  const search = new URLSearchParams()
  if (params.taskId) search.set('taskId', params.taskId)
  if (params.assigneeUserId) search.set('assigneeUserId', params.assigneeUserId)
  if (params.riskStatus) search.set('riskStatus', params.riskStatus)
  if (params.scheduleStatus) search.set('scheduleStatus', params.scheduleStatus)
  const query = search.toString()
  return query ? `?${query}` : ''
}

/**
 * Schedule Runs + Current Schedule
 * Base: /api/projects/{projectId}/schedule-runs, /api/projects/{projectId}/schedule/current
 */
export const SCHEDULE_ENDPOINTS = {
  runs: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/schedule-runs`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/schedule-runs`),
    get: (projectId: string, scheduleRunId: string) =>
      apiPath(`/projects/${projectId}/schedule-runs/${scheduleRunId}`),
    cancel: (projectId: string, scheduleRunId: string) =>
      apiPath(`/projects/${projectId}/schedule-runs/${scheduleRunId}/cancel`),
  },
  current: {
    get: (projectId: string) => apiPath(`/projects/${projectId}/schedule/current`),
    tasks: (projectId: string, params?: TaskScheduleParams) =>
      apiPath(`/projects/${projectId}/schedule/current/tasks${buildQuery(params)}`),
    dailyWork: (projectId: string, params?: { dateFrom?: string; dateTo?: string; assigneeUserId?: string }) => {
      const p = new URLSearchParams()
      if (params?.dateFrom) p.set('dateFrom', params.dateFrom)
      if (params?.dateTo) p.set('dateTo', params.dateTo)
      if (params?.assigneeUserId) p.set('assigneeUserId', params.assigneeUserId)
      const q = p.toString()
      return apiPath(`/projects/${projectId}/schedule/current/daily-work`) + (q ? `?${q}` : '')
    },
    issues: (projectId: string) =>
      apiPath(`/projects/${projectId}/schedule/current/issues`),
  },
  taskSchedule: {
    get: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/schedule`),
    history: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/schedule/history`),
  },
} as const
