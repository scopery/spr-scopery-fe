/**
 * AI Clarity Assessment — v2 API
 * All functions are disabled in the simplified MVP.
 * Guards throw before any network call is made.
 */

import { FEATURES } from '@/config/features'
import { AI_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { AssessOnePayload, AssessOneResponse, ClaritySummary } from '@/types/aiClarity'

function assertFeatureEnabled(flag: boolean, name: string): void {
  if (!flag) {
    throw new Error(`Feature "${name}" is currently disabled in the simplified MVP.`)
  }
}

export async function getClaritySummary(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<ClaritySummary> {
  assertFeatureEnabled(FEATURES.aiClarityAssessment, 'aiClarityAssessment')
  const url = AI_ENDPOINTS.claritySummary(orgId, projectId, sessionId)
  return apiClient.get<ClaritySummary>(url)
}

export async function assessOne(
  orgId: string,
  projectId: string,
  sessionId: string,
  payload: AssessOnePayload
): Promise<AssessOneResponse> {
  assertFeatureEnabled(FEATURES.aiClarityAssessment, 'aiClarityAssessment')
  const url = AI_ENDPOINTS.clarityAssessOne(orgId, projectId, sessionId)
  return apiClient.post<AssessOneResponse>(url, payload)
}
