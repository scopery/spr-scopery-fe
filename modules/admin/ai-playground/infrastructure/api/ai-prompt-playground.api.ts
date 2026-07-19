import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import { AI_PLAYGROUND_ENDPOINTS } from './endpoints'
import type {
  PromptActualTestResult,
  PromptDryRunResult,
  PromptPlaygroundContext,
  PromptTestPayload,
} from '../../domain/model/ai-prompt-playground'

function assertEnabled(): void {
  if (!FEATURES.aiAdminAgents) {
    throw new Error('AI Agent Control is currently disabled.')
  }
}

export async function getPlaygroundContext(
  agentId: string,
  orgId?: string
): Promise<PromptPlaygroundContext> {
  assertEnabled()
  return apiClient.get<PromptPlaygroundContext>(AI_PLAYGROUND_ENDPOINTS.context(agentId, orgId))
}

export async function dryRunPromptTest(
  agentId: string,
  payload: PromptTestPayload
): Promise<PromptDryRunResult> {
  assertEnabled()
  return apiClient.post<PromptDryRunResult>(AI_PLAYGROUND_ENDPOINTS.dryRun(agentId), payload)
}

export async function runPromptTest(
  agentId: string,
  payload: PromptTestPayload
): Promise<PromptActualTestResult> {
  assertEnabled()
  return apiClient.post<PromptActualTestResult>(AI_PLAYGROUND_ENDPOINTS.run(agentId), payload)
}
