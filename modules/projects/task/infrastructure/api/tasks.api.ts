import { PROJECT_ENDPOINTS } from '../../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { assertBulkItemCount, type BulkJobResponse } from '@/shared/lib/bulkJobs'
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
  // Strip status before building URLs — BE accepts one enum; arrays become "A,B,C" via toString().
  const { status: statusFilter, ...rest } = params ?? {}
  const statuses =
    statusFilter == null
      ? []
      : (Array.isArray(statusFilter) ? statusFilter : [statusFilter]).filter(Boolean)

  if (statuses.length > 1) {
    const pages = await Promise.all(
      statuses.map((status) =>
        apiClient.get<ProjectTaskPageResponse>(
          PROJECT_ENDPOINTS.tasks.list(projectId, { ...rest, status })
        )
      )
    )
    const byId = new Map<string, ProjectTask>()
    for (const page of pages) {
      for (const item of page.items ?? []) byId.set(item.id, item)
    }
    const items = [...byId.values()]
    return {
      items,
      page: 0,
      size: items.length,
      totalElements: items.length,
    }
  }

  return apiClient.get<ProjectTaskPageResponse>(
    PROJECT_ENDPOINTS.tasks.list(projectId, {
      ...rest,
      status: statuses[0],
    })
  )
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

/** Wave-1 stub — no bulk UI yet; submit only, poll in caller. */
export async function submitTasksBulk(
  projectId: string,
  items: CreateTaskPayload[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(PROJECT_ENDPOINTS.tasks.bulk(projectId), { items }, { skipGlobalLoading: true })
}

export async function updateTask(
  projectId: string,
  taskId: string,
  body: UpdateTaskPayload
): Promise<ProjectTask> {
  return apiClient.put<ProjectTask>(PROJECT_ENDPOINTS.tasks.update(projectId, taskId), body)
}

export async function assignTask(
  projectId: string,
  taskId: string,
  inChargeUserId: string
): Promise<ProjectTask> {
  const task = await apiClient.get<ProjectTask>(PROJECT_ENDPOINTS.tasks.get(projectId, taskId))
  return apiClient.put<ProjectTask>(PROJECT_ENDPOINTS.tasks.update(projectId, taskId), {
    projectPhaseId: task.projectPhaseId,
    wbsNodeId: task.wbsNodeId,
    title: task.title,
    description: task.description,
    inChargeUserId,
    plannedRoleCode: task.plannedRoleCode,
    plannedRoleName: task.plannedRoleName,
    estimateHours: task.estimateHours,
    plannedStartDate: task.plannedStartDate,
    dueDate: task.dueDate,
    priority: task.priority,
  })
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
