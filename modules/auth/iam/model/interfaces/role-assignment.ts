export interface IamRoleAssignment {
  id: string
  assigneeType: string
  assigneeId: string
  roleId: string
  workspaceId: string | null
  assignedBy: string | null
  assignedAt: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateRoleAssignmentPayload {
  assigneeType: string
  assigneeId: string
  roleId: string
  workspaceId?: string
  assignedBy?: string
}

export interface SearchRoleAssignmentsParams {
  roleId?: string
  assigneeId?: string
  assigneeType?: string
  status?: string
  workspaceId?: string
  page?: number
  size?: number
}
