import type { TaskPriority, TaskStatus } from '../../../project/domain/enums/project.enum'

export interface ProjectTask {
  id: string
  projectId: string
  projectPhaseId: string | null
  wbsNodeId: string | null
  code: string
  title: string
  description: string | null
  inChargeUserId: string | null
  plannedRoleCode: string | null
  plannedRoleName: string | null
  estimateHours: number | null
  plannedStartDate: string | null
  dueDate: string | null
  priority: TaskPriority | string
  status: TaskStatus | string
  startedAt: string | null
  startedBy: string | null
  blockedAt: string | null
  completedAt: string | null
  completedBy: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  archivedAt: string | null
  archivedBy: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  projectPhaseId: string
  wbsNodeId?: string | null
  code: string
  title: string
  description?: string | null
  inChargeUserId?: string | null
  plannedRoleCode?: string | null
  plannedRoleName?: string | null
  /** Required by BE — must be ≥ 0.01 */
  estimateHours: number
  plannedStartDate?: string | null
  dueDate?: string | null
  priority?: TaskPriority | string
}

export interface UpdateTaskPayload {
  projectPhaseId?: string | null
  wbsNodeId?: string | null
  title?: string
  description?: string | null
  inChargeUserId?: string | null
  plannedRoleCode?: string | null
  plannedRoleName?: string | null
  estimateHours?: number | null
  plannedStartDate?: string | null
  dueDate?: string | null
  priority?: TaskPriority | string
}

export interface ProjectTaskPageResponse {
  items: ProjectTask[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
  first?: boolean
  last?: boolean
}

export interface ListTasksParams {
  projectPhaseId?: string
  wbsNodeId?: string
  /** One status, or multiple — API fans out to one request per status (BE is single-value). */
  status?: string | string[]
  priority?: string
  keyword?: string
  page?: number
  size?: number
}
