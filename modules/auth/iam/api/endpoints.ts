import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

const usersBase = () => apiPath('/iam/users')
const rolesBase = () => apiPath('/iam/roles')
const rightsBase = () => apiPath('/iam/rights')
const grantsBase = () => apiPath('/iam/grants')
const assignmentsBase = () => apiPath('/iam/role-assignments')
const resourcesBase = () => apiPath('/iam/resources')
const authorizationBase = () => apiPath('/iam/authorization')
const permissionsBase = () => apiPath('/iam/permissions')

export const IAM_ENDPOINTS = {
  users: {
    create: () => usersBase(),
    search: (params?: { keyword?: string; status?: string; page?: number; size?: number }) =>
      withQuery(usersBase(), params),
    get: (userId: string) => apiPath(`/iam/users/${userId}`),
    update: (userId: string) => apiPath(`/iam/users/${userId}`),
    activate: (userId: string) => apiPath(`/iam/users/${userId}/activate`),
    deactivate: (userId: string) => apiPath(`/iam/users/${userId}/deactivate`),
    suspend: (userId: string) => apiPath(`/iam/users/${userId}/suspend`),
  },
  roles: {
    createSystem: () => apiPath('/iam/roles/system'),
    createWorkspace: () => apiPath('/iam/roles/workspace'),
    get: (roleId: string) => apiPath(`/iam/roles/${roleId}`),
    search: (params?: {
      keyword?: string
      workspaceId?: string
      roleScope?: string
      roleSource?: string
      status?: string
      includeDeleted?: boolean
      page?: number
      size?: number
    }) => withQuery(rolesBase(), params),
    update: (roleId: string) => apiPath(`/iam/roles/${roleId}`),
    activate: (roleId: string) => apiPath(`/iam/roles/${roleId}/activate`),
    deactivate: (roleId: string) => apiPath(`/iam/roles/${roleId}/deactivate`),
    softDelete: (roleId: string) => apiPath(`/iam/roles/${roleId}/soft-delete`),
  },
  rights: {
    get: (rightId: string) => apiPath(`/iam/rights/${rightId}`),
    search: (params?: {
      keyword?: string
      module?: string
      status?: string
      page?: number
      size?: number
    }) => withQuery(rightsBase(), params),
  },
  grants: {
    create: () => grantsBase(),
    get: (grantId: string) => apiPath(`/iam/grants/${grantId}`),
    search: (params?: {
      subjectId?: string
      resourceId?: string
      status?: string
      page?: number
      size?: number
    }) => withQuery(grantsBase(), params),
    revoke: (grantId: string) => apiPath(`/iam/grants/${grantId}/revoke`),
    listRights: (grantId: string) => apiPath(`/iam/grants/${grantId}/rights`),
    addRight: (grantId: string) => apiPath(`/iam/grants/${grantId}/rights`),
    removeRight: (grantId: string, rightId: string) =>
      apiPath(`/iam/grants/${grantId}/rights/${rightId}`),
    listActions: (grantId: string) => apiPath(`/iam/grants/${grantId}/actions`),
    addAction: (grantId: string) => apiPath(`/iam/grants/${grantId}/actions`),
    removeAction: (grantId: string, permissionActionId: string) =>
      apiPath(`/iam/grants/${grantId}/actions/${permissionActionId}`),
    delegate: () => apiPath('/iam/grants:delegate'),
  },
  roleAssignments: {
    create: () => assignmentsBase(),
    get: (assignmentId: string) => apiPath(`/iam/role-assignments/${assignmentId}`),
    search: (params?: {
      roleId?: string
      assigneeId?: string
      assigneeType?: string
      status?: string
      workspaceId?: string
      page?: number
      size?: number
    }) => withQuery(assignmentsBase(), params),
    activate: (assignmentId: string) =>
      apiPath(`/iam/role-assignments/${assignmentId}/activate`),
    deactivate: (assignmentId: string) =>
      apiPath(`/iam/role-assignments/${assignmentId}/deactivate`),
  },
  resources: {
    create: () => resourcesBase(),
    get: (resourceId: string) => apiPath(`/iam/resources/${resourceId}`),
    search: (params?: {
      keyword?: string
      resourceType?: string
      status?: string
      page?: number
      size?: number
    }) => withQuery(resourcesBase(), params),
    update: (resourceId: string) => apiPath(`/iam/resources/${resourceId}`),
    activate: (resourceId: string) => apiPath(`/iam/resources/${resourceId}/activate`),
    deactivate: (resourceId: string) => apiPath(`/iam/resources/${resourceId}/deactivate`),
  },
  authorization: {
    check: () => apiPath('/iam/authorization/check'),
    checkBatch: () => apiPath('/iam/authorization/check-batch'),
    checkByRight: () => apiPath('/iam/authorization/check-by-right'),
    explain: (params?: {
      permissionCode?: string
      actionCode?: string
      resourceType?: string
      resourceRefId?: string
    }) => withQuery(apiPath('/iam/authorization/explain'), params),
  },
  permissions: {
    matrix: () => apiPath('/iam/permissions/matrix'),
    search: (params?: Record<string, string | number | boolean | undefined>) =>
      withQuery(permissionsBase(), params),
    get: (permissionId: string) => apiPath(`/iam/permissions/${permissionId}`),
    listActions: (permissionId: string) =>
      apiPath(`/iam/permissions/${permissionId}/actions`),
  },
  ownerPolicies: {
    list: (params?: { page?: number; size?: number; status?: string }) =>
      withQuery(apiPath('/iam/owner-policies'), params),
    get: (policyId: string) => apiPath(`/iam/owner-policies/${policyId}`),
    create: () => apiPath('/iam/owner-policies'),
  },
  me: {
    get: () => apiPath('/iam/me'),
  },
  auditEvents: {
    list: (params?: {
      eventType?: string
      severity?: string
      actorId?: string
      resourceType?: string
      organizationId?: string
      workspaceId?: string
      page?: number
      size?: number
    }) => withQuery(apiPath('/iam/audit-events'), params),
  },
} as const

/** @deprecated Use IAM_ENDPOINTS.roles.get */
export const legacyRoleEndpoint = (roleId: string) => IAM_ENDPOINTS.roles.get(roleId)

/** @deprecated Use IAM_ENDPOINTS.roleAssignments.search */
export function legacyRoleAssignmentsEndpoint(params: {
  assigneeId: string
  status?: string
  page?: number
  size?: number
}) {
  return IAM_ENDPOINTS.roleAssignments.search(params)
}
