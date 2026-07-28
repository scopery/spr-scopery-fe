export { IAM_ENDPOINTS } from './api/endpoints'
export * as iamUsersApi from './api/users.api'
export * as iamRolesApi from './api/roles.api'
export * as iamRightsApi from './api/rights.api'
export * as iamGrantsApi from './api/grants.api'
export * as iamRoleAssignmentsApi from './api/role-assignments.api'
export * as iamResourcesApi from './api/resources.api'
export * as iamAuthorizationApi from './api/authorization.api'
export * as iamOwnerPoliciesApi from './api/owner-policies.api'
export * as iamAuditEventsApi from './api/audit-events.api'
export * as iamMeApi from './api/me.api'
export {
  SUPER_ADMIN_ROLE_CODE,
  userHasSuperAdminRole,
  getRole,
  listUserRoleAssignments,
} from './api/iam.api'
export type {
  IamPageResponse,
  IamUser,
  UpdateIamUserPayload,
  CreateIamUserPayload,
  IamRole,
  CreateSystemRolePayload,
  CreateWorkspaceRolePayload,
  UpdateRolePayload,
  SearchRolesParams,
  IamRight,
  SearchRightsParams,
  IamGrant,
  CreateGrantPayload,
  SearchGrantsParams,
  IamGrantRight,
  AddGrantRightPayload,
  CreateDelegationPayload,
  CreateDelegationActionPayload,
  IamRoleAssignment,
  CreateRoleAssignmentPayload,
  SearchRoleAssignmentsParams,
  IamResource,
  CreateResourcePayload,
  UpdateResourcePayload,
  SearchResourcesParams,
  IamAuthResourceType,
  AuthorizationCheckPayload,
  AuthorizationCheckBatchPayload,
  AuthorizationCheckResult,
  AuthorizationExplainResult,
  AuthorizationCheckByRightPayload,
  AuthorizationCheckByRightResult,
  IamOwnerPolicy,
  CreateOwnerPolicyPayload,
  SearchOwnerPoliciesParams,
  IamAuditEvent,
  SearchAuditEventsParams,
  IamMe,
  IamMeOrganizationMembership,
  IamMeSecurityState,
} from './model'
export {
  IamPermissionCode,
  IamActionCode,
  IamResourceType,
} from './model'
export { isPlatformAdmin, isSuperAdminRole } from './lib/system-roles'
export {
  authorizationKey,
  authorizationKeyFromCheck,
  isAuthorizationAllowed,
  toAuthorizationAllowedMap,
} from './lib/authorization-key'
export {
  PLATFORM_ADMIN_ENTRY_CHECKS,
  workspaceShellChecks,
  organizationTeamChecks,
} from './lib/authorization-checks'
export { useAuthorizationCheck } from './hooks/useAuthorizationCheck'
export { useAuthorizationBatch } from './hooks/useAuthorizationBatch'
export { usePlatformAdminAccess } from './hooks/usePlatformAdminAccess'
export { useWorkspaceAuthorization } from './hooks/useWorkspaceAuthorization'
export { useAppShellAuthorization } from './hooks/useAppShellAuthorization'
export { useNavCapabilities } from './hooks/useNavCapabilities'
export { useNavCapabilityDeepLinkGuard } from './hooks/useNavCapabilityDeepLinkGuard'
export { useMemberPermissionsCatalog, useMemberPermissionsEditor } from './hooks/useMemberPermissions'
export { MemberPermissionsPanel } from './presentation/ui/MemberPermissionsPanel'
export { resolveNavCapabilityForPath } from './lib/nav-route-capabilities'
export { NavCapabilityKey } from './model/nav-capabilities'
export type { NavCapabilityPack, CapabilitiesResponse } from './model/nav-capabilities'
export type {
  MemberPermissionCatalogItem,
  MemberPermissionCatalogResponse,
  MemberPermissionsSnapshotResponse,
} from './model/member-permissions'
export * as iamCapabilitiesApi from './api/capabilities.api'
export * as iamMemberPermissionsApi from './api/member-permissions.api'
export * as iamPermissionsApi from './api/permissions.api'
export type {
  IamPermission,
  IamPermissionAction,
  IamResourceScopeLevel,
  IamDataAccessPolicy,
  IamPermissionCategory,
  IamPermissionSubjectType,
  IamPermissionRiskLevel,
  SearchPermissionsParams,
  IamGrantPermissionAction,
  AddGrantPermissionActionPayload,
} from './model'
