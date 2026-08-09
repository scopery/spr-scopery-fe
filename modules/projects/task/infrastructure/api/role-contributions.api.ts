import { PROJECT_ENDPOINTS } from '../../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  CreateTaskRoleContributionPayload,
  TaskRoleContribution,
} from '../../domain/model/task-role-contribution'

export async function listTaskRoleContributions(
  projectId: string,
  taskId: string
): Promise<TaskRoleContribution[]> {
  return apiClient.get<TaskRoleContribution[]>(
    PROJECT_ENDPOINTS.tasks.roleContributions.list(projectId, taskId)
  )
}

export async function createTaskRoleContribution(
  projectId: string,
  taskId: string,
  body: CreateTaskRoleContributionPayload
): Promise<TaskRoleContribution> {
  return apiClient.post<TaskRoleContribution>(
    PROJECT_ENDPOINTS.tasks.roleContributions.create(projectId, taskId),
    body
  )
}

export async function deleteTaskRoleContribution(
  projectId: string,
  taskId: string,
  id: string
): Promise<void> {
  await apiClient.delete(
    PROJECT_ENDPOINTS.tasks.roleContributions.delete(projectId, taskId, id)
  )
}
