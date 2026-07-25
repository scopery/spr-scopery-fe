import { PROJECT_ENDPOINTS } from '../../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  CreateTaskPayload,
  ListTasksParams,
  ProjectTask,
  ProjectTaskPageResponse,
  UpdateTaskPayload,
} from '../../domain/model/task'

export async function listTasks(
  projectId: string,
  params?: ListTasksParams
): Promise<ProjectTaskPageResponse> {
  return apiClient.get<ProjectTaskPageResponse>(PROJECT_ENDPOINTS.tasks.list(projectId, params))
}

export async function getTask(projectId: string, taskId: string): Promise<ProjectTask> {
  return apiClient.get<ProjectTask>(PROJECT_ENDPOINTS.tasks.get(projectId, taskId))
}

export async function createTask(
  projectId: string,
  body: CreateTaskPayload
): Promise<ProjectTask> {
  return apiClient.post<ProjectTask>(PROJECT_ENDPOINTS.tasks.create(projectId), body)
}

export async function updateTask(
  projectId: string,
  taskId: string,
  body: UpdateTaskPayload
): Promise<ProjectTask> {
  return apiClient.put<ProjectTask>(PROJECT_ENDPOINTS.tasks.update(projectId, taskId), body)
}

export async function startTask(projectId: string, taskId: string): Promise<ProjectTask> {
  return apiClient.patch<ProjectTask>(PROJECT_ENDPOINTS.tasks.start(projectId, taskId))
}

export async function blockTask(projectId: string, taskId: string): Promise<ProjectTask> {
  return apiClient.patch<ProjectTask>(PROJECT_ENDPOINTS.tasks.block(projectId, taskId))
}

export async function completeTask(projectId: string, taskId: string): Promise<ProjectTask> {
  return apiClient.patch<ProjectTask>(PROJECT_ENDPOINTS.tasks.complete(projectId, taskId))
}

export async function cancelTask(projectId: string, taskId: string): Promise<ProjectTask> {
  return apiClient.patch<ProjectTask>(PROJECT_ENDPOINTS.tasks.cancel(projectId, taskId))
}

export async function archiveTask(projectId: string, taskId: string): Promise<ProjectTask> {
  return apiClient.patch<ProjectTask>(PROJECT_ENDPOINTS.tasks.archive(projectId, taskId))
}

export async function reopenTask(projectId: string, taskId: string): Promise<ProjectTask> {
  return apiClient.patch<ProjectTask>(PROJECT_ENDPOINTS.tasks.reopen(projectId, taskId))
}
