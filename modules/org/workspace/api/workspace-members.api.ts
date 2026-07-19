import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_ENDPOINTS } from './endpoints'
import type { PageResponse, WorkspaceMember } from '../model'

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
