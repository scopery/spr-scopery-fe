export type IamResourceScopeLevel = 'SYSTEM' | 'ORGANIZATION' | 'WORKSPACE'
export type IamDataAccessPolicy = 'OWNER_ONLY' | 'ANCESTOR_INHERITED' | 'SCOPE_WIDE'
export type IamPermissionCategory =
  | 'SECURITY'
  | 'RESOURCE_ADMIN'
  | 'GOVERNANCE'
  | 'NOTIFICATION_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'WORKSPACE_ADMIN'
  | 'ACCESS_CONTROL'
  | 'TEAM_ADMIN'
  | 'MEMBER_ADMIN'
  | 'CONTENT_ADMIN'
export type IamPermissionSubjectType = 'USER' | 'TEAM' | 'ROLE'
export type IamPermissionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface IamPermissionAction {
  id: string
  permissionId: string
  code: string
  name: string
  description: string | null
}

export interface IamPermission {
  id: string
  code: string
  name: string
  moduleCode: string | null
  description: string | null
  resourceScopeLevel: IamResourceScopeLevel
  dataAccessPolicy: IamDataAccessPolicy
  permissionCategory: IamPermissionCategory
  assignableSubjectTypes: IamPermissionSubjectType[]
  riskLevel: IamPermissionRiskLevel
  status: 'ACTIVE' | 'INACTIVE'
  actions: IamPermissionAction[]
}

export interface SearchPermissionsParams {
  keyword?: string
  moduleCode?: string
  resourceScopeLevel?: IamResourceScopeLevel
  dataAccessPolicy?: IamDataAccessPolicy
  permissionCategory?: IamPermissionCategory
  riskLevel?: IamPermissionRiskLevel
  assignableSubjectType?: IamPermissionSubjectType
  status?: string
  page?: number
  size?: number
}
