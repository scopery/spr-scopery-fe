export interface IamGrant {
  id: string
  subjectType: string
  subjectId: string
  resourceId: string
  roleId: string | null
  effect: string
  scopeType: string | null
  scopeRefId: string | null
  workspaceId: string | null
  kind?: string | null
  sourcePolicyId?: string | null
  canDelegate?: boolean
  delegationDepth?: number
  expiresAt?: string | null
  conditionJson?: string | null
  reason?: string | null
  status: string
  grantedBy: string | null
  grantedAt: string
  version?: number
  createdAt: string
  updatedAt: string
}

export interface CreateGrantPayload {
  subjectType: string
  subjectId: string
  resourceId: string
  roleId?: string
  effect?: string
  scopeType?: string
  scopeRefId?: string
  workspaceId?: string
  expiresAt?: string
}

export interface SearchGrantsParams {
  subjectId?: string
  resourceId?: string
  workspaceId?: string
  status?: string
  page?: number
  size?: number
}

/** Join row from GET /iam/grants/{id}/rights — not a full Right entity. */
export interface IamGrantRight {
  grantId: string
  rightId: string
  createdAt: string
}

export interface AddGrantRightPayload {
  rightId: string
}

/** Permission action attached to a grant (GET /iam/grants/{id}/actions). */
export interface IamGrantPermissionAction {
  grantId: string
  resourceId: string
  workspaceId: string | null
  permissionActionId: string
  permissionId: string
  permissionCode: string
  actionCode: string
  rightId: string | null
  legacyRightCode: string | null
  createdAt: string
}

export interface AddGrantPermissionActionPayload {
  permissionActionId?: string
  permissionCode?: string
  actionCode?: string
}
