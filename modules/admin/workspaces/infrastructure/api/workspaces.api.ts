import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_V1_ENDPOINTS } from './endpoints'
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceTeam,
  WorkspaceTeamMember,
  WorkspaceInvitation,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  SearchWorkspacesParams,
  CreateTeamPayload,
  UpdateTeamPayload,
  CreateInvitationPayload,
} from '../../domain/model/workspace'

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

// Workspaces
export async function createWorkspace(body: CreateWorkspacePayload): Promise<Workspace> {
  return apiClient.post<Workspace>(WORKSPACE_V1_ENDPOINTS.workspaces.create(), body)
}

export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  return apiClient.get<Workspace>(WORKSPACE_V1_ENDPOINTS.workspaces.get(workspaceId))
}

export async function searchWorkspaces(params?: SearchWorkspacesParams): Promise<PageResponse<Workspace>> {
  return apiClient.get<PageResponse<Workspace>>(WORKSPACE_V1_ENDPOINTS.workspaces.search(params))
}

export async function updateWorkspace(workspaceId: string, body: UpdateWorkspacePayload): Promise<Workspace> {
  return apiClient.put<Workspace>(WORKSPACE_V1_ENDPOINTS.workspaces.update(workspaceId), body)
}

export async function activateWorkspace(workspaceId: string): Promise<Workspace> {
  return apiClient.patch<Workspace>(WORKSPACE_V1_ENDPOINTS.workspaces.activate(workspaceId))
}

export async function archiveWorkspace(workspaceId: string): Promise<Workspace> {
  return apiClient.patch<Workspace>(WORKSPACE_V1_ENDPOINTS.workspaces.archive(workspaceId))
}

// Members
export async function listWorkspaceMembers(
  workspaceId: string,
  params?: { userId?: string; status?: string; page?: number; size?: number }
): Promise<PageResponse<WorkspaceMember>> {
  return apiClient.get<PageResponse<WorkspaceMember>>(
    WORKSPACE_V1_ENDPOINTS.members.list(workspaceId, params)
  )
}

export async function addWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember> {
  return apiClient.post<WorkspaceMember>(WORKSPACE_V1_ENDPOINTS.members.add(workspaceId), { userId })
}

export async function activateWorkspaceMember(workspaceId: string, memberId: string): Promise<WorkspaceMember> {
  return apiClient.patch<WorkspaceMember>(WORKSPACE_V1_ENDPOINTS.members.activate(workspaceId, memberId))
}

export async function deactivateWorkspaceMember(workspaceId: string, memberId: string): Promise<WorkspaceMember> {
  return apiClient.patch<WorkspaceMember>(WORKSPACE_V1_ENDPOINTS.members.deactivate(workspaceId, memberId))
}

// Teams
export async function createTeam(workspaceId: string, body: CreateTeamPayload): Promise<WorkspaceTeam> {
  return apiClient.post<WorkspaceTeam>(WORKSPACE_V1_ENDPOINTS.teams.create(workspaceId), body)
}

export async function getTeam(workspaceId: string, teamId: string): Promise<WorkspaceTeam> {
  return apiClient.get<WorkspaceTeam>(WORKSPACE_V1_ENDPOINTS.teams.get(workspaceId, teamId))
}

export async function searchTeams(
  workspaceId: string,
  params?: { status?: string; page?: number; size?: number }
): Promise<PageResponse<WorkspaceTeam>> {
  return apiClient.get<PageResponse<WorkspaceTeam>>(
    WORKSPACE_V1_ENDPOINTS.teams.search(workspaceId, params)
  )
}

export async function updateTeam(workspaceId: string, teamId: string, body: UpdateTeamPayload): Promise<WorkspaceTeam> {
  return apiClient.put<WorkspaceTeam>(WORKSPACE_V1_ENDPOINTS.teams.update(workspaceId, teamId), body)
}

export async function activateTeam(workspaceId: string, teamId: string): Promise<WorkspaceTeam> {
  return apiClient.patch<WorkspaceTeam>(WORKSPACE_V1_ENDPOINTS.teams.activate(workspaceId, teamId))
}

export async function archiveTeam(workspaceId: string, teamId: string): Promise<WorkspaceTeam> {
  return apiClient.patch<WorkspaceTeam>(WORKSPACE_V1_ENDPOINTS.teams.archive(workspaceId, teamId))
}

export async function addTeamMember(
  workspaceId: string,
  teamId: string,
  userId: string
): Promise<WorkspaceTeamMember> {
  return apiClient.post<WorkspaceTeamMember>(
    WORKSPACE_V1_ENDPOINTS.teams.addMember(workspaceId, teamId),
    { userId }
  )
}

export async function listTeamMembers(
  workspaceId: string,
  teamId: string,
  params?: { page?: number; size?: number }
): Promise<PageResponse<WorkspaceTeamMember>> {
  return apiClient.get<PageResponse<WorkspaceTeamMember>>(
    WORKSPACE_V1_ENDPOINTS.teams.listMembers(workspaceId, teamId, params)
  )
}

export async function removeTeamMember(workspaceId: string, teamId: string, userId: string): Promise<void> {
  await apiClient.delete<void>(
    WORKSPACE_V1_ENDPOINTS.teams.removeMember(workspaceId, teamId, userId),
    { parseJson: false }
  )
}

// Invitations
export async function createInvitation(workspaceId: string, body: CreateInvitationPayload): Promise<WorkspaceInvitation> {
  return apiClient.post<WorkspaceInvitation>(WORKSPACE_V1_ENDPOINTS.invitations.create(workspaceId), body)
}

export async function listInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  return apiClient.get<WorkspaceInvitation[]>(WORKSPACE_V1_ENDPOINTS.invitations.list(workspaceId))
}

export async function revokeInvitation(workspaceId: string, invitationId: string): Promise<WorkspaceInvitation> {
  return apiClient.patch<WorkspaceInvitation>(
    WORKSPACE_V1_ENDPOINTS.invitations.revoke(workspaceId, invitationId)
  )
}

export async function acceptInvitationByCode(code: string): Promise<void> {
  await apiClient.post<void>(WORKSPACE_V1_ENDPOINTS.invitations.accept(code), {})
}
