'use client'

import { useMemo } from 'react'
import { useAuthorizationBatch } from './useAuthorizationBatch'
import { organizationTeamChecks, workspaceShellChecks } from '../lib/authorization-checks'
import { IamActionCode, IamPermissionCode } from '../model/enums/iam-permission.enum'

/**
 * Workspace shell permission flags from check-batch.
 * Pass organizationId for Phase 03 org-team gates (OrgTeam APIs).
 * Do not fall back to owner role — BE grants are authoritative.
 */
export function useWorkspaceAuthorization(
  workspaceId: string | null,
  organizationId?: string | null
) {
  const checks = useMemo(() => {
    const list = workspaceId ? workspaceShellChecks(workspaceId) : []
    if (organizationId) {
      return [...list, ...organizationTeamChecks(organizationId)]
    }
    return list
  }, [workspaceId, organizationId])

  const { isAllowed, loading, error, results, refetch } = useAuthorizationBatch(checks, {
    enabled: !!workspaceId,
  })

  return {
    loading,
    error,
    results,
    refetch,
    canViewWorkspace: isAllowed(IamPermissionCode.WorkspaceManagement, IamActionCode.View),
    canUpdateWorkspace:
      isAllowed(IamPermissionCode.WorkspaceManagement, IamActionCode.Update) ||
      isAllowed(IamPermissionCode.WorkspaceManagement, IamActionCode.ManageSetting),
    canManageMembers: isAllowed(
      IamPermissionCode.WorkspaceAccessManagement,
      IamActionCode.ManageMember
    ),
    canInviteMembers: isAllowed(
      IamPermissionCode.WorkspaceAccessManagement,
      IamActionCode.InviteMember
    ),
    canManageJoinRequests: isAllowed(
      IamPermissionCode.WorkspaceAccessManagement,
      IamActionCode.ManageJoinRequest
    ),
    canViewTeams: isAllowed(IamPermissionCode.TeamManagement, IamActionCode.View),
    canCreateTeams: isAllowed(IamPermissionCode.TeamManagement, IamActionCode.Create),
    canUpdateTeams: isAllowed(IamPermissionCode.TeamManagement, IamActionCode.Update),
    canArchiveTeams: isAllowed(IamPermissionCode.TeamManagement, IamActionCode.Archive),
    canManageTeams:
      isAllowed(IamPermissionCode.TeamManagement, IamActionCode.Manage) ||
      isAllowed(IamPermissionCode.TeamManagement, IamActionCode.Create) ||
      isAllowed(IamPermissionCode.TeamManagement, IamActionCode.Update),
    canViewTeamMembers: isAllowed(IamPermissionCode.TeamMemberManagement, IamActionCode.View),
    canAddTeamMembers: isAllowed(IamPermissionCode.TeamMemberManagement, IamActionCode.Add),
    canRemoveTeamMembers: isAllowed(IamPermissionCode.TeamMemberManagement, IamActionCode.Remove),
    canViewProjects: isAllowed(IamPermissionCode.ProjectManagement, IamActionCode.View),
    canCreateProjects: isAllowed(IamPermissionCode.ProjectManagement, IamActionCode.Create),
  }
}
