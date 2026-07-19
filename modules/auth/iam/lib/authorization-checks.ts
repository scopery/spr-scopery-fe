import type { AuthorizationCheckPayload } from '../model'
import { IamActionCode, IamPermissionCode, IamResourceType } from '../model/enums/iam-permission.enum'

/** GLOBAL checks that unlock the platform Admin shell (any one allowed → entry). */
export const PLATFORM_ADMIN_ENTRY_CHECKS: AuthorizationCheckPayload[] = [
  {
    permissionCode: IamPermissionCode.SystemIamManagement,
    actionCode: IamActionCode.ViewUser,
    resourceType: IamResourceType.Global,
  },
  {
    permissionCode: IamPermissionCode.SystemGovernanceManagement,
    actionCode: IamActionCode.View,
    resourceType: IamResourceType.Global,
  },
  {
    permissionCode: IamPermissionCode.SystemResourceManagement,
    actionCode: IamActionCode.View,
    resourceType: IamResourceType.Global,
  },
  {
    permissionCode: IamPermissionCode.SystemNotificationManagement,
    actionCode: IamActionCode.ViewNotification,
    resourceType: IamResourceType.Global,
  },
]

/** Workspace sidebar / settings gates for a concrete workspace. */
export function workspaceShellChecks(workspaceId: string): AuthorizationCheckPayload[] {
  return [
    {
      permissionCode: IamPermissionCode.WorkspaceManagement,
      actionCode: IamActionCode.View,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
    {
      permissionCode: IamPermissionCode.WorkspaceManagement,
      actionCode: IamActionCode.Update,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
    {
      permissionCode: IamPermissionCode.WorkspaceManagement,
      actionCode: IamActionCode.ManageSetting,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
    {
      permissionCode: IamPermissionCode.WorkspaceAccessManagement,
      actionCode: IamActionCode.ManageMember,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
    {
      permissionCode: IamPermissionCode.WorkspaceAccessManagement,
      actionCode: IamActionCode.InviteMember,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
    {
      permissionCode: IamPermissionCode.WorkspaceAccessManagement,
      actionCode: IamActionCode.ManageJoinRequest,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
    {
      permissionCode: IamPermissionCode.ProjectManagement,
      actionCode: IamActionCode.View,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
    {
      permissionCode: IamPermissionCode.ProjectManagement,
      actionCode: IamActionCode.Create,
      resourceType: IamResourceType.Workspace,
      resourceRefId: workspaceId,
    },
  ]
}

/** Organization-scoped team gates (Phase 03 OrgTeam APIs). */
export function organizationTeamChecks(organizationId: string): AuthorizationCheckPayload[] {
  return [
    {
      permissionCode: IamPermissionCode.TeamManagement,
      actionCode: IamActionCode.View,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
    {
      permissionCode: IamPermissionCode.TeamManagement,
      actionCode: IamActionCode.Create,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
    {
      permissionCode: IamPermissionCode.TeamManagement,
      actionCode: IamActionCode.Update,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
    {
      permissionCode: IamPermissionCode.TeamManagement,
      actionCode: IamActionCode.Archive,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
    {
      permissionCode: IamPermissionCode.TeamManagement,
      actionCode: IamActionCode.Manage,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
    {
      permissionCode: IamPermissionCode.TeamMemberManagement,
      actionCode: IamActionCode.View,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
    {
      permissionCode: IamPermissionCode.TeamMemberManagement,
      actionCode: IamActionCode.Add,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
    {
      permissionCode: IamPermissionCode.TeamMemberManagement,
      actionCode: IamActionCode.Remove,
      resourceType: IamResourceType.Organization,
      resourceRefId: organizationId,
    },
  ]
}
