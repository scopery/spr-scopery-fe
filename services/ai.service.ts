/**
 * AI Features Service
 * All functions are disabled in the simplified MVP.
 * Guards throw before any network call is made.
 */

import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  ImproveAnswerRequest,
  ImproveAnswerResponse,
  ImproveAnswerCommitRequest,
  QGenGenerateRequest,
  QGenGenerateResponse,
  QGenCommitRequest,
  ClarityAssessOneRequest,
  ClarityAssessOneResponse,
  ClaritySummaryResponse,
  IntakeUploadUrlRequest,
  IntakeUploadUrlResponse,
  IntakeCreateRequest,
  IntakeResponse,
  ImpactAnalysisRequest,
  ImpactAnalysisResponse,
  ImpactCommitRequest,
} from '@/types/ai'

function assertFeatureEnabled(flag: boolean, name: string): void {
  if (!flag) {
    throw new Error(`Feature "${name}" is currently disabled in the simplified MVP.`)
  }
}

// ============================================================================
// 1. Improve Answer
// ============================================================================

export async function improveAnswer(
  orgId: string,
  projectId: string,
  sessionId: string,
  payload: ImproveAnswerRequest
): Promise<ImproveAnswerResponse> {
  assertFeatureEnabled(FEATURES.aiImproveAnswer, 'aiImproveAnswer')
  return apiClient.post<ImproveAnswerResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/improve`,
    payload
  )
}

export async function commitImproveAnswer(
  orgId: string,
  projectId: string,
  sessionId: string,
  payload: ImproveAnswerCommitRequest
): Promise<void> {
  assertFeatureEnabled(FEATURES.aiImproveAnswer, 'aiImproveAnswer')
  return apiClient.post<void>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/improve/commit`,
    payload
  )
}

// ============================================================================
// 2. Generate Clarifying Questions
// ============================================================================

export async function generateQuestions(
  orgId: string,
  projectId: string,
  payload: QGenGenerateRequest
): Promise<QGenGenerateResponse> {
  assertFeatureEnabled(FEATURES.aiGenerateQuestions, 'aiGenerateQuestions')
  return apiClient.post<QGenGenerateResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/ai/questions/generate`,
    payload
  )
}

export async function commitGeneratedQuestions(
  orgId: string,
  projectId: string,
  payload: QGenCommitRequest
): Promise<void> {
  assertFeatureEnabled(FEATURES.aiGenerateQuestions, 'aiGenerateQuestions')
  return apiClient.post<void>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/ai/questions/commit`,
    payload
  )
}

// ============================================================================
// 3. Clarity Assessment
// ============================================================================

export async function assessClarityOne(
  orgId: string,
  projectId: string,
  sessionId: string,
  payload: ClarityAssessOneRequest
): Promise<ClarityAssessOneResponse> {
  assertFeatureEnabled(FEATURES.aiClarityAssessment, 'aiClarityAssessment')
  return apiClient.post<ClarityAssessOneResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/clarity/assess-one`,
    payload
  )
}

export async function getClaritySummary(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<ClaritySummaryResponse> {
  assertFeatureEnabled(FEATURES.aiClarityAssessment, 'aiClarityAssessment')
  return apiClient.get<ClaritySummaryResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/clarity/summary`
  )
}

// ============================================================================
// 4. Impact Analysis — Intakes
// ============================================================================

export async function getIntakeUploadUrl(
  orgId: string,
  projectId: string,
  payload: IntakeUploadUrlRequest
): Promise<IntakeUploadUrlResponse> {
  assertFeatureEnabled(FEATURES.aiImpactAnalysis, 'aiImpactAnalysis')
  return apiClient.post<IntakeUploadUrlResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/ai/intakes/upload-url`,
    payload
  )
}

export async function createIntake(
  orgId: string,
  projectId: string,
  payload: IntakeCreateRequest
): Promise<IntakeResponse> {
  assertFeatureEnabled(FEATURES.aiImpactAnalysis, 'aiImpactAnalysis')
  return apiClient.post<IntakeResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/ai/intakes`,
    payload
  )
}

// ============================================================================
// 5. Impact Analysis
// ============================================================================

export async function runImpactAnalysis(
  orgId: string,
  projectId: string,
  payload: ImpactAnalysisRequest
): Promise<ImpactAnalysisResponse> {
  assertFeatureEnabled(FEATURES.aiImpactAnalysis, 'aiImpactAnalysis')
  return apiClient.post<ImpactAnalysisResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/ai/impact-analysis`,
    payload
  )
}

export async function commitImpactAnalysis(
  orgId: string,
  projectId: string,
  payload: ImpactCommitRequest
): Promise<void> {
  assertFeatureEnabled(FEATURES.aiImpactAnalysis, 'aiImpactAnalysis')
  return apiClient.post<void>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/ai/impact-analysis/commit`,
    payload
  )
}
