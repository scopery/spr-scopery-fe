import type { TaskAssignmentType } from '../enums/capacity.enum'

export interface TaskResourceAssignment {
  id: string
  projectId: string
  taskId: string
  resourceProfileId: string
  assignmentType: TaskAssignmentType | string
  plannedEffortHours: number | null
  status: string
}

export interface CreateTaskResourceAssignmentPayload {
  resourceProfileId: string
  assignmentType: TaskAssignmentType | string
  plannedEffortHours?: number | null
}
