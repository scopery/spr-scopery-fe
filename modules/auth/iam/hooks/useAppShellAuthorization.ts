'use client'

import { useMemo } from 'react'
import { useAuthorizationBatch } from './useAuthorizationBatch'
import {
  PLATFORM_ADMIN_ENTRY_CHECKS,
  workspaceShellChecks,
  organizationTeamChecks,
} from '../lib/authorization-checks'
import { IamActionCode, IamPermissionCode } from '../model/enums/iam-permission.enum'

/**
 * Single auth batch for AppShell — merges platform-admin checks + workspace shell checks
 * into one API call instead of two separate useAuthorizationBatch calls.
 */
export function useAppShellAuthorization(
  workspaceId: string | null,
  organizationId?: string | null
) {
  const checks = useMemo(() => {
    if (!workspaceId) return []
    return [
      ...PLATFORM_ADMIN_ENTRY_CHECKS,
      ...workspaceShellChecks(workspaceId),
      ...(organizationId ? organizationTeamChecks(organizationId) : []),
    ]
  }, [workspaceId, organizationId])

  const { isAllowed, anyAllowed, loading, error, refetch } = useAuthorizationBatch(checks, {
    enabled: !!workspaceId,
  })

  return {
    loading,
    error,
    refetch,
    canAccessAdmin:
      anyAllowed &&
      (isAllowed(IamPermissionCode.SystemIamManagement, IamActionCode.ViewUser) ||
        isAllowed(IamPermissionCode.SystemGovernanceManagement, IamActionCode.View) ||
        isAllowed(IamPermissionCode.SystemResourceManagement, IamActionCode.View) ||
        isAllowed(
          IamPermissionCode.SystemNotificationManagement,
          IamActionCode.ViewNotification
        )),
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
    canViewProjects: isAllowed(IamPermissionCode.ProjectManagement, IamActionCode.View),
    canCreateProjects: isAllowed(IamPermissionCode.ProjectManagement, IamActionCode.Create),
  }
}
