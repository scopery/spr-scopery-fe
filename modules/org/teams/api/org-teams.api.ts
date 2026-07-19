import { apiClient } from '@/shared/lib/apiClient'
import { ORG_TEAM_ENDPOINTS } from './endpoints'
import type {
  CreateOrgTeamPayload,
  OrgTeam,
  OrgTeamMember,
  OrgTeamWorkspaceAssignment,
  PageResponse,
  UpdateOrgTeamPayload,
} from '../model'

export async function createOrgTeam(
  organizationId: string,
  body: CreateOrgTeamPayload
): Promise<OrgTeam> {
  return apiClient.post<OrgTeam>(ORG_TEAM_ENDPOINTS.create(organizationId), body)
}

export async function getOrgTeam(organizationId: string, teamId: string): Promise<OrgTeam> {
  return apiClient.get<OrgTeam>(ORG_TEAM_ENDPOINTS.get(organizationId, teamId))
}

export async function searchOrgTeams(
  organizationId: string,
  params?: { keyword?: string; status?: string; page?: number; size?: number }
): Promise<PageResponse<OrgTeam>> {
  return apiClient.get<PageResponse<OrgTeam>>(ORG_TEAM_ENDPOINTS.search(organizationId, params))
}

export async function updateOrgTeam(
  organizationId: string,
  teamId: string,
  body: UpdateOrgTeamPayload
): Promise<OrgTeam> {
  return apiClient.put<OrgTeam>(ORG_TEAM_ENDPOINTS.update(organizationId, teamId), body)
}

export async function activateOrgTeam(organizationId: string, teamId: string): Promise<OrgTeam> {
  return apiClient.patch<OrgTeam>(ORG_TEAM_ENDPOINTS.activate(organizationId, teamId))
}

export async function archiveOrgTeam(organizationId: string, teamId: string): Promise<OrgTeam> {
  return apiClient.patch<OrgTeam>(ORG_TEAM_ENDPOINTS.archive(organizationId, teamId))
}

export async function addOrgTeamMember(
  organizationId: string,
  teamId: string,
  userId: string
): Promise<OrgTeamMember> {
  return apiClient.post<OrgTeamMember>(ORG_TEAM_ENDPOINTS.addMember(organizationId, teamId), {
    userId,
  })
}

export async function listOrgTeamMembers(
  organizationId: string,
  teamId: string,
  params?: { page?: number; size?: number }
): Promise<PageResponse<OrgTeamMember>> {
  return apiClient.get<PageResponse<OrgTeamMember>>(
    ORG_TEAM_ENDPOINTS.listMembers(organizationId, teamId, params)
  )
}

export async function removeOrgTeamMember(
  organizationId: string,
  teamId: string,
  userId: string
): Promise<void> {
  await apiClient.delete<void>(ORG_TEAM_ENDPOINTS.removeMember(organizationId, teamId, userId), {
    parseJson: false,
  })
}

export async function assignOrgTeamToWorkspace(
  organizationId: string,
  teamId: string,
  workspaceId: string
): Promise<OrgTeamWorkspaceAssignment> {
  return apiClient.post<OrgTeamWorkspaceAssignment>(
    ORG_TEAM_ENDPOINTS.assignWorkspace(organizationId, teamId),
    { workspaceId }
  )
}

export async function listOrgTeamWorkspaceAssignments(
  organizationId: string,
  teamId: string,
  params?: { page?: number; size?: number }
): Promise<PageResponse<OrgTeamWorkspaceAssignment>> {
  return apiClient.get<PageResponse<OrgTeamWorkspaceAssignment>>(
    ORG_TEAM_ENDPOINTS.listWorkspaceAssignments(organizationId, teamId, params)
  )
}

export async function revokeOrgTeamWorkspaceAssignment(
  organizationId: string,
  teamId: string,
  assignmentId: string
): Promise<OrgTeamWorkspaceAssignment> {
  return apiClient.delete<OrgTeamWorkspaceAssignment>(
    ORG_TEAM_ENDPOINTS.revokeWorkspaceAssignment(organizationId, teamId, assignmentId)
  )
}
