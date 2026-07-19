export interface AIRoutingListItem {
  ruleId: string
  name: string
  description: string | null
  agentId: string
  agentKey: string
  agentName: string
  orgId: string | null
  projectId: string | null
  mode: string | null
  priority: number
  active: boolean
  conditionSummary: string
  targetModelId: string
  targetModelName: string | null
  fallbackEnabled: boolean
  fallbackModelId: string | null
  fallbackModelName: string | null
  maxFallbackAttempts: number
  updatedAt: string
}

export interface AIRoutingDryRunResult {
  defaultModelId: string
  defaultModelName: string
  selectedModelId: string
  selectedModelName: string
  routingApplied: boolean
  matchedRuleId: string | null
  routingReason: string
  fallbackModelId: string | null
  fallbackEnabled: boolean
  warnings: string[]
  estimatedInputTokens: number
  estimatedTotalTokens: number
  budgetState: string
}

export interface CreateAIRoutingRulePayload {
  org_id?: string | null
  agent_id: string
  name: string
  description?: string | null
  mode?: string | null
  condition_json?: Record<string, unknown>
  target_model_id: string
  fallback_model_id?: string | null
  fallback_enabled?: boolean
  max_fallback_attempts?: number
  priority?: number
  active?: boolean
}

export type UpdateAIRoutingRulePayload = Partial<Omit<CreateAIRoutingRulePayload, 'agent_id'>>
