export interface TaskResourceAssignment {
  id: string
  projectId: string
  taskId: string
  workspaceMemberId: string
  userId: string | null
  roleId: string | null
  estimatedHours: number | null
  actualHours: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskResourceAssignmentPayload {
  workspaceMemberId: string
  roleId?: string | null
  estimatedHours?: number | null
}
