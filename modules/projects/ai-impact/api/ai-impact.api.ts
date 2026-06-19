import { AI_ENDPOINTS } from '../../project/api/ai-endpoints'
/**
 * AI impact analysis and intakes API — project-scoped (future routes).
 */

import { apiClient } from '@/shared/lib/apiClient'
import type {
  ImpactAnalysisBody,
  ImpactAnalysisResponse,
  ImpactCommitBody,
  IntakesCreateBody,
  IntakesCreateResponse,
  IntakesUploadUrlBody,
  IntakesUploadUrlResponse,
} from '../model/ai-impact'

export type {
  ImpactAnalysisBody,
  ImpactAnalysisResponse,
  ImpactCommitBody,
  ImpactCommitDecision,
  ImpactProposal,
  IntakesCreateBody,
  IntakesCreateResponse,
  IntakesUploadUrlBody,
  IntakesUploadUrlResponse,
} from '../model/ai-impact'

export async function getIntakesUploadUrl(
  orgId: string,
  projectId: string,
  body: IntakesUploadUrlBody
): Promise<IntakesUploadUrlResponse> {
  const url = AI_ENDPOINTS.intakesUploadUrl(orgId, projectId)
  return apiClient.post<IntakesUploadUrlResponse>(url, body)
}

export async function createIntake(
  orgId: string,
  projectId: string,
  body: IntakesCreateBody
): Promise<IntakesCreateResponse> {
  const url = AI_ENDPOINTS.intakes(orgId, projectId)
  return apiClient.post<IntakesCreateResponse>(url, body)
}

export async function runImpactAnalysis(
  orgId: string,
  projectId: string,
  body: ImpactAnalysisBody
): Promise<ImpactAnalysisResponse> {
  const url = AI_ENDPOINTS.impactAnalysis(orgId, projectId)
  return apiClient.post<ImpactAnalysisResponse>(url, body)
}

export async function impactAnalysisCommit(
  orgId: string,
  projectId: string,
  body: ImpactCommitBody,
  init?: { skipAuthRedirect?: boolean }
): Promise<{
  revision_id?: string
  revision?: { id: string; number?: number; created_at?: string }
  updated_items_count?: number
}> {
  const url = AI_ENDPOINTS.impactAnalysisCommit(orgId, projectId)
  return apiClient.post(url, body, init)
}
