export { useEffectivePermissions } from './access/hooks/useEffectivePermissions'
export * as accessApi from './access/api/access.api'
export {
  PERMISSIONS,
  isSuspended,
  isOrgReadonly,
  canEditProject,
  resolveProjectRole,
  hasPermission,
  canManageProjectContentFallback,
  buildDocumentSpacePermissions,
  buildAIPermissions,
  buildCollaborationPermissions,
} from './access/lib/permissions'
export type { PermissionKey, EffectivePermissions } from './access/lib/permissions'
