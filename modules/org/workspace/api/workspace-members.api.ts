import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_ENDPOINTS } from './endpoints'
import type { PageResponse, WorkspaceMember } from '../model'
import type {
  ReplaceMemberProjectAccessPayload,
  WorkspaceMemberAccessResponse,
} from '../model/member-project-access'

export type {
  MemberProjectAccessItem,
  ReplaceMemberProjectAccessPayload,
  WorkspaceMemberAccessResponse,
} from '../model/member-project-access'
export { ProjectAccessMode } from '../model/member-project-access'

export async function listWorkspaceMembers(
  workspaceId: string,
  params?: { status?: string; page?: number; size?: number }
): Promise<PageResponse<WorkspaceMember>> {
  return apiClient.get<PageResponse<WorkspaceMember>>(
    WORKSPACE_ENDPOINTS.members(workspaceId, params)
  )
}

export async function deactivateWorkspaceMember(
  workspaceId: string,
  memberId: string
): Promise<WorkspaceMember> {
  return apiClient.patch<WorkspaceMember>(
    WORKSPACE_ENDPOINTS.deactivateMember(workspaceId, memberId)
  )
}

export async function getWorkspaceMemberAccess(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMemberAccessResponse> {
  return apiClient.get<WorkspaceMemberAccessResponse>(
    WORKSPACE_ENDPOINTS.accessByUser(workspaceId, userId)
  )
}

export async function replaceWorkspaceMemberProjectAccess(
  workspaceId: string,
  userId: string,
  body: ReplaceMemberProjectAccessPayload
): Promise<WorkspaceMemberAccessResponse> {
  return apiClient.put<WorkspaceMemberAccessResponse>(
    WORKSPACE_ENDPOINTS.projectAccessByUser(workspaceId, userId),
    body
  )
}
