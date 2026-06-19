import type {
  AIRoutingDryRunResult,
  AIRoutingListItem,
  CreateAIRoutingRulePayload,
  UpdateAIRoutingRulePayload,
} from '../model/ai-routing'
import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'

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
  const query = new URLSearchParams()
  if (params?.org_id) query.set('org_id', params.org_id)
  if (params?.agent_id) query.set('agent_id', params.agent_id)
  if (params?.active !== undefined) query.set('active', String(params.active))
  const qs = query.toString()
  return apiClient.get<{ items: AIRoutingListItem[] }>(
    `/api/v2/admin/ai-routing-rules${qs ? `?${qs}` : ''}`
  )
}

export async function createRoutingRule(
  payload: CreateAIRoutingRulePayload
): Promise<AIRoutingListItem> {
  assertEnabled()
  return apiClient.post<AIRoutingListItem>('/api/v2/admin/ai-routing-rules', payload)
}

export async function updateRoutingRule(
  ruleId: string,
  payload: UpdateAIRoutingRulePayload
): Promise<AIRoutingListItem> {
  assertEnabled()
  return apiClient.patch<AIRoutingListItem>(`/api/v2/admin/ai-routing-rules/${ruleId}`, payload)
}

export async function dryRunRouting(payload: {
  agent_key: string
  mode: string
  org_id?: string
  budget_state?: string
}): Promise<AIRoutingDryRunResult> {
  assertEnabled()
  return apiClient.post<AIRoutingDryRunResult>('/api/v2/admin/ai-routing-rules/dry-run', payload)
}

export type {
  AIRoutingDryRunResult,
  AIRoutingListItem,
  CreateAIRoutingRulePayload,
  UpdateAIRoutingRulePayload,
} from '../model/ai-routing'
