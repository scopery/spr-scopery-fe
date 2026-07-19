import { apiClient } from '@/shared/lib/apiClient'
import { AI_CONTEXT_ENDPOINTS } from './intelligence.endpoints'
import type { AiContextAuditEntry, AiContextResolutionResult } from '../model/intelligence'

export async function resolveAiContext(body: {
  policyId?: string | null
  projectId: string
  documentId: string
}): Promise<AiContextResolutionResult> {
  return apiClient.post(AI_CONTEXT_ENDPOINTS.resolve(), body)
}

export async function listAiContextAudit(
  documentId: string,
  page = 0,
  size = 20
): Promise<{
  content?: AiContextAuditEntry[]
  items?: AiContextAuditEntry[]
  totalElements?: number
  [key: string]: unknown
}> {
  return apiClient.get(AI_CONTEXT_ENDPOINTS.audit(documentId, page, size))
}
