import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { AI_ROUTING_ENDPOINTS } from './endpoints'
import type {
  AIRoutingDryRunResult,
  AIRoutingListItem,
  CreateAIRoutingRulePayload,
  UpdateAIRoutingRulePayload,
} from '../../domain/model/ai-routing'

function assertEnabled(): void {
  if (!FEATURES.aiAdminAgents) {
    throw new Error('AI Agent Control is currently disabled.')
  }
}

export async function listRoutingRules(params?: {
  org_id?: string
  agent_id?: string
  active?: boolean
}): Promise<{ items: AIRoutingListItem[] }> {
  assertEnabled()
  const res = await apiClient.get<ListPayload<AIRoutingListItem>>(AI_ROUTING_ENDPOINTS.list(params))
  return normalizeItemList(res)
}

export async function createRoutingRule(
  payload: CreateAIRoutingRulePayload
): Promise<AIRoutingListItem> {
  assertEnabled()
  return apiClient.post<AIRoutingListItem>(AI_ROUTING_ENDPOINTS.create(), payload)
}

export async function updateRoutingRule(
  ruleId: string,
  payload: UpdateAIRoutingRulePayload
): Promise<AIRoutingListItem> {
  assertEnabled()
  return apiClient.patch<AIRoutingListItem>(AI_ROUTING_ENDPOINTS.detail(ruleId), payload)
}

export async function dryRunRouting(payload: {
  agent_key: string
  mode: string
  org_id?: string
  budget_state?: string
}): Promise<AIRoutingDryRunResult> {
  assertEnabled()
  return apiClient.post<AIRoutingDryRunResult>(AI_ROUTING_ENDPOINTS.dryRun(), payload)
}
