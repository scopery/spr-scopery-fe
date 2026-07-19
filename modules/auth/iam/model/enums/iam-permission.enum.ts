/**
 * Permission / action codes from live GET /api/iam/permissions/matrix.
 * Use with POST /iam/authorization/check or check-batch — do not infer from roles.
 */

export const IamPermissionCode = {
  SystemIamManagement: 'SYSTEM_IAM_MANAGEMENT',
  SystemResourceManagement: 'SYSTEM_RESOURCE_MANAGEMENT',
  SystemGovernanceManagement: 'SYSTEM_GOVERNANCE_MANAGEMENT',
  SystemNotificationManagement: 'SYSTEM_NOTIFICATION_MANAGEMENT',
  OrganizationManagement: 'ORGANIZATION_MANAGEMENT',
  OrganizationMemberManagement: 'ORGANIZATION_MEMBER_MANAGEMENT',
  OrganizationInvitationManagement: 'ORGANIZATION_INVITATION_MANAGEMENT',
  WorkspaceManagement: 'WORKSPACE_MANAGEMENT',
  WorkspaceAccessManagement: 'WORKSPACE_ACCESS_MANAGEMENT',
  WorkspaceMemberManagement: 'WORKSPACE_MEMBER_MANAGEMENT',
  WorkspaceRoleManagement: 'WORKSPACE_ROLE_MANAGEMENT',
  TeamManagement: 'TEAM_MANAGEMENT',
  TeamMemberManagement: 'TEAM_MEMBER_MANAGEMENT',
  ProjectManagement: 'PROJECT_MANAGEMENT',
} as const

export type IamPermissionCode = (typeof IamPermissionCode)[keyof typeof IamPermissionCode]

export const IamActionCode = {
  View: 'VIEW',
  Create: 'CREATE',
  Update: 'UPDATE',
  Archive: 'ARCHIVE',
  Manage: 'MANAGE',
  Delete: 'DELETE',
  Add: 'ADD',
  Remove: 'REMOVE',
  ViewUser: 'VIEW_USER',
  CreateUser: 'CREATE_USER',
  ViewRole: 'VIEW_ROLE',
  ManageRole: 'MANAGE_ROLE',
  ViewRight: 'VIEW_RIGHT',
  ViewAccessGrant: 'VIEW_ACCESS_GRANT',
  ManageAccessGrant: 'MANAGE_ACCESS_GRANT',
  ViewNotification: 'VIEW_NOTIFICATION',
  CreateWorkspace: 'CREATE_WORKSPACE',
  InviteMember: 'INVITE_MEMBER',
  ManageMember: 'MANAGE_MEMBER',
  ManageInvitation: 'MANAGE_INVITATION',
  ManageJoinRequest: 'MANAGE_JOIN_REQUEST',
  RequestJoin: 'REQUEST_JOIN',
  ManageAccess: 'MANAGE_ACCESS',
  ManagePermission: 'MANAGE_PERMISSION',
  ManageSetting: 'MANAGE_SETTING',
  ManageTeam: 'MANAGE_TEAM',
  AssignRole: 'ASSIGN_ROLE',
} as const

export type IamActionCode = (typeof IamActionCode)[keyof typeof IamActionCode]

export const IamResourceType = {
  Global: 'GLOBAL',
  Organization: 'ORGANIZATION',
  Workspace: 'WORKSPACE',
  Team: 'TEAM',
  Project: 'PROJECT',
} as const

export type IamResourceType = (typeof IamResourceType)[keyof typeof IamResourceType]
