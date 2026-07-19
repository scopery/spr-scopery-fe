import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import { ADMIN_AI_ENDPOINTS } from './endpoints'
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
} from '../../domain/model/ai'

function assertFeatureEnabled(flag: boolean, name: string): void {
  if (!flag) {
    throw new Error(`Feature "${name}" is currently disabled in the simplified MVP.`)
  }
}

export async function listAiConfigs(): Promise<AiConfigsListResponse> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.get<AiConfigsListResponse>(ADMIN_AI_ENDPOINTS.configs.list())
}

export async function updateAiConfig(
  purpose: AiPurpose,
  payload: AiConfigUpdateRequest
): Promise<AiConfig> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.patch<AiConfig>(ADMIN_AI_ENDPOINTS.configs.detail(purpose), payload)
}

export async function testRunAiConfig(
  purpose: AiPurpose,
  payload: AiTestRunRequest
): Promise<AiTestRunResponse> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.post<AiTestRunResponse>(ADMIN_AI_ENDPOINTS.configs.testRun(purpose), payload)
}

export async function listAiRuns(params?: AiRunsListRequest): Promise<AiRunsListResponse> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.get<AiRunsListResponse>(ADMIN_AI_ENDPOINTS.runs.list(params))
}

export async function getAiRun(runId: string): Promise<AiRun> {
  assertFeatureEnabled(FEATURES.aiAdminConfig, 'aiAdminConfig')
  return apiClient.get<AiRun>(ADMIN_AI_ENDPOINTS.runs.detail(runId))
}
