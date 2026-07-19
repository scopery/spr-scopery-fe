export { SUPER_ADMIN_ROLE_CODE, userHasSuperAdminRole } from '../api/iam.api'
export type { IamRole, IamRoleAssignment } from '../model'

export function isSuperAdminRole(roleCode: string | undefined | null): boolean {
  return roleCode === 'SUPER_ADMIN'
}

export function isPlatformAdmin(profileRole?: string | null, isSuperAdmin?: boolean): boolean {
  return isSuperAdmin === true || profileRole === 'admin'
}
