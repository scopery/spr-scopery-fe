import { AI_ENDPOINTS } from '../../../projects/project/api/ai-endpoints'
/**
 * AI answer-improve API — session-scoped v2 endpoints.
 */

import { apiClient } from '@/shared/lib/apiClient'
import type { ImproveBody, ImproveCommitBody, ImproveResponse } from '../model/ai-improve'

export type { ImproveBody, ImproveCommitBody, ImproveResponse } from '../model/ai-improve'

export async function improveAnswer(
  orgId: string,
  projectId: string,
  sessionId: string,
  body: ImproveBody
): Promise<ImproveResponse> {
  const url = AI_ENDPOINTS.improve(orgId, projectId, sessionId)
  return apiClient.post<ImproveResponse>(url, body)
}

export async function improveCommit(
  orgId: string,
  projectId: string,
  sessionId: string,
  body: ImproveCommitBody
): Promise<void> {
  const url = AI_ENDPOINTS.improveCommit(orgId, projectId, sessionId)
  return apiClient.post<void>(url, body)
}
