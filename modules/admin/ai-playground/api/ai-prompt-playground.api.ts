import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  PromptActualTestResult,
  PromptDryRunResult,
  PromptPlaygroundContext,
  PromptTestPayload,
} from '../model/ai-prompt-playground'

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
  const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  return apiClient.get<PromptPlaygroundContext>(
    `/api/v2/admin/ai-agents/${agentId}/playground${qs}`
  )
}

export async function dryRunPromptTest(
  agentId: string,
  payload: PromptTestPayload
): Promise<PromptDryRunResult> {
  assertEnabled()
  return apiClient.post<PromptDryRunResult>(
    `/api/v2/admin/ai-agents/${agentId}/playground/dry-run`,
    payload
  )
}

export async function runPromptTest(
  agentId: string,
  payload: PromptTestPayload
): Promise<PromptActualTestResult> {
  assertEnabled()
  return apiClient.post<PromptActualTestResult>(
    `/api/v2/admin/ai-agents/${agentId}/playground/run`,
    payload
  )
}

export type {
  PromptActualTestResult,
  PromptDryRunResult,
  PromptPlaygroundContext,
  PromptTestPayload,
} from '../model/ai-prompt-playground'
