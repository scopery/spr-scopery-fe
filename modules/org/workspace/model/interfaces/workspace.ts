export interface WorkspaceDetail {
  id: string
  organizationId: string
  code: string
  name: string
  description: string | null
  ownerUserId: string
  defaultVisibility: string
  joinPolicy: string
  status: string
  createdAt: string
  updatedAt: string
  ownerMembershipCreated: boolean
}

export interface CreateWorkspacePayload {
  organizationId: string
  name: string
  code: string
  description?: string
  defaultVisibility?: string
  joinPolicy?: string
}

export interface UpdateWorkspacePayload {
  name: string
  description?: string
  defaultVisibility?: string
  joinPolicy?: string
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  status: string
  joinedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
