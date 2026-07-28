import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_INVITATION_ENDPOINTS } from './endpoints'
import type {
  WorkspaceInvitation,
  CreateWorkspaceInvitationPayload,
} from '../model'

export async function listWorkspaceInvitations(
  workspaceId: string
): Promise<WorkspaceInvitation[]> {
  return apiClient.get<WorkspaceInvitation[]>(WORKSPACE_INVITATION_ENDPOINTS.list(workspaceId))
}

export async function createWorkspaceInvitation(
  workspaceId: string,
  payload: CreateWorkspaceInvitationPayload
): Promise<WorkspaceInvitation> {
  return apiClient.post<WorkspaceInvitation>(
    WORKSPACE_INVITATION_ENDPOINTS.create(workspaceId),
    payload
  )
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string
): Promise<WorkspaceInvitation> {
  return apiClient.patch<WorkspaceInvitation>(
    WORKSPACE_INVITATION_ENDPOINTS.revoke(workspaceId, invitationId)
  )
}

export async function acceptWorkspaceInvitationByCode(code: string): Promise<void> {
  await apiClient.post<void>(WORKSPACE_INVITATION_ENDPOINTS.acceptByCode(code), undefined, {
    parseJson: false,
  })
}

export async function acceptWorkspaceInvitationById(invitationId: string): Promise<void> {
  await apiClient.post<void>(WORKSPACE_INVITATION_ENDPOINTS.acceptById(invitationId), undefined, {
    parseJson: false,
  })
}
