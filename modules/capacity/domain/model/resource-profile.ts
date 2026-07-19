import type { ResourceProfileStatus, ResourceType } from '../enums/capacity.enum'

export interface ResourceProfile {
  id: string
  workspaceId: string
  resourceType: ResourceType
  displayName: string
  linkedUserId: string | null
  linkedWorkspaceMemberId: string | null
  primaryRoleId: string | null
  status: ResourceProfileStatus
  createdAt: string
  updatedAt: string
}

export interface CreateResourceProfilePayload {
  resourceType: ResourceType
  displayName: string
  linkedUserId?: string | null
  linkedWorkspaceMemberId?: string | null
  primaryRoleId?: string | null
}

export interface SyncFromMembersResult {
  createdCount: number
  skippedCount: number
  errorCount: number
  created?: ResourceProfile[]
  errors?: Array<{ workspaceMemberId?: string; message: string }>
}
