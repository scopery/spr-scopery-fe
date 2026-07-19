export interface IamRole {
  id: string
  code: string
  name: string
  description: string | null
  status: string
  roleScope: string
  roleSource: string
  workspaceId: string | null
  parentRoleId: string | null
  isSystem: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSystemRolePayload {
  code: string
  name: string
  description?: string
  roleScope?: string
  roleSource?: string
  parentRoleId?: string
}

export interface CreateWorkspaceRolePayload extends CreateSystemRolePayload {
  workspaceId: string
}

export interface UpdateRolePayload {
  name: string
  description?: string
}

export interface SearchRolesParams {
  keyword?: string
  workspaceId?: string
  roleScope?: string
  roleSource?: string
  status?: string
  includeDeleted?: boolean
  page?: number
  size?: number
}
