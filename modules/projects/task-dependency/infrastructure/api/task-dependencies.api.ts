import { apiClient } from '@/shared/lib/apiClient'
import { TASK_DEP_ENDPOINTS } from './endpoints'
import type { CreateTaskDependencyPayload, TaskDependency } from '../../domain/model/task-dependency'

export async function listDependencies(
  projectId: string,
  params?: { predecessorTaskId?: string; successorTaskId?: string }
): Promise<TaskDependency[]> {
  const res = await apiClient.get<{ items: TaskDependency[] }>(TASK_DEP_ENDPOINTS.list(projectId, params))
  return res?.items ?? []
}

export async function getDependency(
  projectId: string,
  dependencyId: string
): Promise<TaskDependency> {
  return apiClient.get<TaskDependency>(TASK_DEP_ENDPOINTS.get(projectId, dependencyId))
}

export async function createDependency(
  projectId: string,
  body: CreateTaskDependencyPayload
): Promise<TaskDependency> {
  return apiClient.post<TaskDependency>(TASK_DEP_ENDPOINTS.create(projectId), body)
}

export async function deleteDependency(
  projectId: string,
  dependencyId: string
): Promise<void> {
  await apiClient.delete<void>(TASK_DEP_ENDPOINTS.delete(projectId, dependencyId), {
    parseJson: false,
  })
}
