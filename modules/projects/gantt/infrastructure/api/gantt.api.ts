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

export async function getCriticalPath(projectId: string): Promise<CriticalPathItem[]> {
  return apiClient.get<CriticalPathItem[]>(GANTT_ENDPOINTS.criticalPath(projectId))
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
