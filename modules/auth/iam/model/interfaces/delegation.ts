export interface CreateDelegationActionPayload {
  permissionCode: string
  actionCode: string
}

export interface CreateDelegationPayload {
  subjectType: string
  subjectId: string
  resourceType: string
  resourceRefId: string
  delegationDepth: number
  expiresAt?: string
  condition?: Record<string, unknown>
  reason?: string
  actions: CreateDelegationActionPayload[]
}
