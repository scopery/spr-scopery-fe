import { apiPath } from '@/shared/lib/api-paths'
import type { GanttViewParams } from '../../domain/model/gantt'

function buildQuery(params?: GanttViewParams): string {
  if (!params) return ''
  const search = new URLSearchParams()
  if (params.scheduleRunId) search.set('scheduleRunId', params.scheduleRunId)
  if (params.dateFrom) search.set('dateFrom', params.dateFrom)
  if (params.dateTo) search.set('dateTo', params.dateTo)
  if (params.includeUnscheduled !== undefined)
    search.set('includeUnscheduled', String(params.includeUnscheduled))
  if (params.includeArchived !== undefined)
    search.set('includeArchived', String(params.includeArchived))
  if (params.groupBy) search.set('groupBy', params.groupBy)
  const query = search.toString()
  return query ? `?${query}` : ''
}

/**
 * Gantt
 * Base: /api/projects/{projectId}/gantt
 */
export const GANTT_ENDPOINTS = {
  view: (projectId: string, params?: GanttViewParams) =>
    apiPath(`/projects/${projectId}/gantt${buildQuery(params)}`),
  recalculate: (projectId: string) =>
    apiPath(`/projects/${projectId}/gantt/recalculate`),
  dependencies: (projectId: string) =>
    apiPath(`/projects/${projectId}/gantt/dependencies`),
  dependency: (projectId: string, depId: string) =>
    apiPath(`/projects/${projectId}/gantt/dependencies/${depId}`),
  issues: (projectId: string) =>
    apiPath(`/projects/${projectId}/gantt/issues`),
  criticalPath: (projectId: string) =>
    apiPath(`/projects/${projectId}/gantt/critical-path`),
  export: (projectId: string, params?: { format?: string; scheduleRunId?: string }) => {
    const p = new URLSearchParams()
    if (params?.format) p.set('format', params.format)
    if (params?.scheduleRunId) p.set('scheduleRunId', params.scheduleRunId)
    const q = p.toString()
    return apiPath(`/projects/${projectId}/gantt/export`) + (q ? `?${q}` : '')
  },
  tasks: {
    move: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/gantt/tasks/${taskId}/move`),
    resize: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/gantt/tasks/${taskId}/resize`),
    clearOverride: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/gantt/tasks/${taskId}/clear-override`),
  },
} as const
