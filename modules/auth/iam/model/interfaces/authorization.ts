/** IAM resource type for authorization checks. */
export type IamAuthResourceType = 'GLOBAL' | 'ORGANIZATION' | 'WORKSPACE' | 'TEAM' | 'PROJECT'

/**
 * Authorization check payload.
 * - GLOBAL: omit resourceRefId (BE resolves GLOBAL_SYSTEM)
 * - ORGANIZATION / WORKSPACE / …: resourceRefId required (business id)
 */
export interface AuthorizationCheckPayload {
  permissionCode: string
  actionCode: string
  resourceType: IamAuthResourceType | string
  resourceRefId?: string | null
}

export interface AuthorizationCheckBatchPayload {
  checks: AuthorizationCheckPayload[]
}

export interface AuthorizationCheckResult {
  permissionCode: string
  actionCode: string
  resourceType: string
  resourceRefId: string | null
  allowed: boolean
  reason: string | null
  contributingGrantIds?: string[]
  explanation?: string | null
}

/** @deprecated Prefer AuthorizationCheckResult — explain uses GET /authorization/explain. */
export type AuthorizationExplainResult = AuthorizationCheckResult

/** Legacy debug endpoint: POST /authorization/check-by-right */
export interface AuthorizationCheckByRightPayload {
  userId: string
  resourceId: string
  rightCode: string
}

export interface AuthorizationCheckByRightResult {
  allowed: boolean
  userId?: string
  resourceId?: string
  rightCode?: string
  reason?: string | null
}
