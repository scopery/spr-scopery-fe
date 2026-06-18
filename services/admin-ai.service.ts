/**
 * Admin AI Service
 * All functions are disabled in the simplified MVP.
 * Guards throw before any network call is made.
 */

import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  AiConfig,
  AiConfigsListResponse,
  AiConfigUpdateRequest,
  AiTestRunRequest,
  AiTestRunResponse,
  AiRun,
  AiRunsListRequest,
  AiRunsListResponse,
  AiPurpose,
} from '@/types/ai'

function assertFeatureEnabled(flag: boolean, name: string): void {
  if (!flag) {
    throw new Error(`Feature "${name}" is currently disabled in the simplified MVP.`)
  }
}

// ============================================================================
// 1. AI Configs
// ============================================================================

export async function listAiConfigs(): Promise<AiConfigsListResponse> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.get<AiConfigsListResponse>('/api/v2/admin/ai/configs')
}

export async function updateAiConfig(purpose: AiPurpose, payload: AiConfigUpdateRequest): Promise<AiConfig> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.patch<AiConfig>(`/api/v2/admin/ai/configs/${purpose}`, payload)
}

export async function testRunAiConfig(purpose: AiPurpose, payload: AiTestRunRequest): Promise<AiTestRunResponse> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.post<AiTestRunResponse>(`/api/v2/admin/ai/configs/${purpose}/test-run`, payload)
}

// ============================================================================
// 2. AI Runs Audit
// ============================================================================

export async function listAiRuns(params?: AiRunsListRequest): Promise<AiRunsListResponse> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  const searchParams = new URLSearchParams()
  if (params?.purpose) searchParams.append('purpose', params.purpose)
  if (params?.status) searchParams.append('status', params.status)
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.offset) searchParams.append('offset', String(params.offset))
  const queryString = searchParams.toString()
  const url = `/api/v2/admin/ai/runs${queryString ? `?${queryString}` : ''}`
  return apiClient.get<AiRunsListResponse>(url)
}

export async function getAiRun(runId: string): Promise<AiRun> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.get<AiRun>(`/api/v2/admin/ai/runs/${runId}`)
}
