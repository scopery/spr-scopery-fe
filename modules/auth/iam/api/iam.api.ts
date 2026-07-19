import * as roleAssignmentsApi from './role-assignments.api'
import * as rolesApi from './roles.api'

export const SUPER_ADMIN_ROLE_CODE = 'SUPER_ADMIN' as const

export async function userHasSuperAdminRole(userId: string): Promise<boolean> {
  const assignments = await roleAssignmentsApi.searchRoleAssignments({
    assigneeId: userId,
    status: 'ACTIVE',
    page: 0,
    size: 50,
  })
  const systemRoleIds = [
    ...new Set(
      assignments.items
        .filter((a) => a.status === 'ACTIVE' && !a.workspaceId)
        .map((a) => a.roleId)
    ),
  ]
  if (!systemRoleIds.length) return false

  const roleResults = await Promise.all(systemRoleIds.map((id) => rolesApi.getRole(id)))
  return roleResults.some((r) => r.code === SUPER_ADMIN_ROLE_CODE && r.status === 'ACTIVE')
}

/** @deprecated Use roleAssignmentsApi.searchRoleAssignments */
export const listUserRoleAssignments = (userId: string) =>
  roleAssignmentsApi.searchRoleAssignments({ assigneeId: userId, status: 'ACTIVE', page: 0, size: 50 })

/** @deprecated Use rolesApi.getRole */
export const getRole = rolesApi.getRole
