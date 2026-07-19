export interface ClientVisibilityIssue {
  issueType: string
  message: string
  resourceId?: string | null
}

export interface ClientVisibilityValidation {
  valid: boolean
  issues: ClientVisibilityIssue[]
}

export interface ResourceTypeDefinition {
  id: string
  code: string
  displayName: string
  description?: string | null
  isSystem: boolean
  enabled: boolean
  createdAt?: string
}

export interface ResourceRef {
  resourceType: string
  resourceId: string
}

/** Align with BE ResolvedResourceResponse (status, not accessible). */
export interface ResolvedResource {
  resourceType: string
  resourceId: string
  displayName: string | null
  status: 'RESOLVED' | 'ACCESS_REVOKED' | 'NOT_FOUND' | string
}

export interface AiContextCitation {
  blockId: string
  documentId: string
  documentTitle?: string | null
  headingPath?: string | null
}

export interface AiContextResolutionResult {
  documentId: string
  contextText: string
  tokenCount: number
  blockCount: number
  citations: AiContextCitation[]
  auditId?: string | null
}

export interface AiContextAuditEntry {
  id: string
  policyId?: string | null
  documentId: string
  actorId?: string | null
  tokenCount?: number | null
  blockCount?: number | null
  status?: string | null
  errorMessage?: string | null
}
