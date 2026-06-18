/**
 * AI feature API — v2 endpoints.
 * Success: object directly. Error: RFC9457. Do not log token/batch_token/raw_text/note content.
 */

import { apiClient } from '@/shared/lib/apiClient'
import { AI_ENDPOINTS } from '@/constants/endpoints'
import type {
  ImproveBody,
  ImproveResponse,
  ImproveCommitBody,
  QuestionsGenerateBody,
  QuestionsGenerateResponse,
  QuestionsCommitBody,
  IntakesUploadUrlResponse,
  IntakesCreateBody,
  IntakesCreateResponse,
  ImpactAnalysisBody,
  ImpactAnalysisResponse,
  ImpactCommitBody,
} from './schemas'

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

export async function questionsGenerate(
  orgId: string,
  projectId: string,
  body: QuestionsGenerateBody
): Promise<QuestionsGenerateResponse> {
  const url = AI_ENDPOINTS.questionsGenerate(orgId, projectId)
  return apiClient.post<QuestionsGenerateResponse>(url, body)
}

export async function questionsCommit(
  orgId: string,
  projectId: string,
  body: QuestionsCommitBody
): Promise<void> {
  const url = AI_ENDPOINTS.questionsCommit(orgId, projectId)
  return apiClient.post<void>(url, body)
}

export interface IntakesUploadUrlBody {
  file_name: string
  mime_type: string
}

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

/** Commit response: backend may return revision object or revision_id */
export async function impactAnalysisCommit(
  orgId: string,
  projectId: string,
  body: ImpactCommitBody,
  init?: { skipAuthRedirect?: boolean }
): Promise<{ revision_id?: string; revision?: { id: string; number?: number; created_at?: string }; updated_items_count?: number }> {
  const url = AI_ENDPOINTS.impactAnalysisCommit(orgId, projectId)
  return apiClient.post(url, body, init)
}
