import { apiClient } from '@/shared/lib/apiClient'
import { GANTT_ENDPOINTS } from './endpoints'
import type {
  CriticalPathItem,
  CreateGanttDependencyPayload,
  GanttDependency,
  GanttExportParams,
  GanttIssue,
  GanttView,
  GanttViewParams,
  MoveGanttTaskPayload,
  RecalculateGanttPayload,
  ResizeGanttTaskPayload,
} from '../../domain/model/gantt'

export async function getGanttView(
  projectId: string,
  params?: GanttViewParams
): Promise<GanttView> {
  return apiClient.get<GanttView>(GANTT_ENDPOINTS.view(projectId, params))
}

export async function recalculateGantt(
  projectId: string,
  body?: RecalculateGanttPayload
): Promise<GanttView> {
  return apiClient.post<GanttView>(GANTT_ENDPOINTS.recalculate(projectId), body)
}

export async function getGanttDependencies(projectId: string): Promise<GanttDependency[]> {
  return apiClient.get<GanttDependency[]>(GANTT_ENDPOINTS.dependencies(projectId))
}

export async function createGanttDependency(
  projectId: string,
  body: CreateGanttDependencyPayload
): Promise<GanttDependency> {
  return apiClient.post<GanttDependency>(GANTT_ENDPOINTS.dependencies(projectId), body)
}

export async function deleteGanttDependency(
  projectId: string,
  depId: string
): Promise<void> {
  await apiClient.delete<void>(GANTT_ENDPOINTS.dependency(projectId, depId), { parseJson: false })
}

export async function getGanttIssues(projectId: string): Promise<GanttIssue[]> {
  return apiClient.get<GanttIssue[]>(GANTT_ENDPOINTS.issues(projectId))
}

/** BE returns `{ projectId, scheduleRunId, tasks, criticalTaskIds }`, not a bare array. */
interface CriticalPathApiTask {
  taskId: string
  title?: string
  taskTitle?: string
  plannedStartDate?: string | null
  plannedFinishDate?: string | null
  startDate?: string | null
  endDate?: string | null
  slackDays?: number
  slack?: number
  critical?: boolean
}

interface CriticalPathApiResponse {
  tasks?: CriticalPathApiTask[]
  criticalTaskIds?: string[]
}

export async function getCriticalPath(projectId: string): Promise<CriticalPathItem[]> {
  const res = await apiClient.get<CriticalPathApiResponse | CriticalPathItem[]>(
    GANTT_ENDPOINTS.criticalPath(projectId)
  )

  if (Array.isArray(res)) return res

  const tasks = res?.tasks
  if (!Array.isArray(tasks)) return []

  const criticalIds = new Set(
    Array.isArray(res.criticalTaskIds) ? res.criticalTaskIds.map(String) : []
  )

  return tasks
    .filter((t) => t.critical === true || criticalIds.has(String(t.taskId)))
    .map((t) => ({
      taskId: String(t.taskId),
      taskTitle: t.taskTitle ?? t.title ?? '',
      startDate: t.startDate ?? t.plannedStartDate ?? null,
      endDate: t.endDate ?? t.plannedFinishDate ?? null,
      slack: t.slack ?? t.slackDays ?? 0,
    }))
}

export async function exportGantt(
  projectId: string,
  params?: GanttExportParams
): Promise<Blob> {
  return apiClient.get<Blob>(GANTT_ENDPOINTS.export(projectId, params))
}

export async function moveGanttTask(
  projectId: string,
  taskId: string,
  body: MoveGanttTaskPayload
): Promise<GanttView> {
  return apiClient.post<GanttView>(GANTT_ENDPOINTS.tasks.move(projectId, taskId), body)
}

export async function resizeGanttTask(
  projectId: string,
  taskId: string,
  body: ResizeGanttTaskPayload
): Promise<GanttView> {
  return apiClient.post<GanttView>(GANTT_ENDPOINTS.tasks.resize(projectId, taskId), body)
}

export async function clearGanttOverride(
  projectId: string,
  taskId: string
): Promise<GanttView> {
  return apiClient.post<GanttView>(GANTT_ENDPOINTS.tasks.clearOverride(projectId, taskId))
}
