import { AI_ENDPOINTS } from '../../../projects/project/api/ai-endpoints'
import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import type { AssessOnePayload, AssessOneResponse, ClaritySummary } from '../model/clarity'

export type { AssessOnePayload, AssessOneResponse, ClaritySummary } from '../model/clarity'

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
