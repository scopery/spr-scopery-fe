import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type {
  CreateTaskResourceAssignmentPayload,
  TaskResourceAssignment,
} from '../../domain/model/task-assignment'

export async function listTaskResourceAssignments(
  projectId: string,
  taskId: string
): Promise<TaskResourceAssignment[]> {
  const data = await apiClient.get<
    TaskResourceAssignment[] | { items: TaskResourceAssignment[] }
  >(CAPACITY_ENDPOINTS.taskAssignments.list(projectId, taskId))
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function createTaskResourceAssignment(
  projectId: string,
  taskId: string,
  body: CreateTaskResourceAssignmentPayload
): Promise<TaskResourceAssignment> {
  return apiClient.post<TaskResourceAssignment>(
    CAPACITY_ENDPOINTS.taskAssignments.create(projectId, taskId),
    body
  )
}

export async function deleteTaskResourceAssignment(
  projectId: string,
  taskId: string,
  assignmentId: string
): Promise<void> {
  await apiClient.delete<void>(
    CAPACITY_ENDPOINTS.taskAssignments.delete(projectId, taskId, assignmentId),
    { parseJson: false }
  )
}
