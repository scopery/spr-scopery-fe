import type { AIAgentVersionStatus, AIRunMode } from '@/types/ai-agent-control'

export interface PromptPlaygroundVersionItem {
  versionId: string
  versionNumber: number
  status: AIAgentVersionStatus
  modelId: string | null
  modelName: string | null
  testable: boolean
}

export interface PromptPlaygroundContext {
  agentId: string
  agentKey: string
  agentName: string
  publishedVersionId: string | null
  versions: PromptPlaygroundVersionItem[]
  defaultMode: AIRunMode
}

export interface PromptRoutingDecisionSummary {
  defaultModelId: string
  defaultModelName: string
  selectedModelId: string
  selectedModelName: string
  routingApplied: boolean
  matchedRuleId: string | null
  routingReason: string
  warnings: string[]
}

export interface PromptDryRunResult {
  success: boolean
  renderedPromptSummary: {
    hasSystemPrompt: boolean
    hasDeveloperPrompt: boolean
    userTemplateLength: number
    userMessageLength: number
    variableKeys: string[]
    missingVariables: string[]
  }
  routingDecision: PromptRoutingDecisionSummary
  estimatedUsage: {
    estimatedInputTokens: number
    estimatedOutputTokens: number
    estimatedTotalTokens: number
    estimatedCost: number | null
    currency: string
  }
  validationErrors: string[]
  warnings: string[]
  versionStatus: AIAgentVersionStatus
}

export interface PromptOutputValidationResult {
  schemaConfigured: boolean
  valid: boolean
  errors: string[]
}

export interface PromptActualTestResult {
  success: boolean
  runId?: string
  output?: string | Record<string, unknown>
  outputValidation?: PromptOutputValidationResult
  usage?: {
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
  }
  estimatedCost?: number | null
  currency?: string
  latencyMs?: number
  routingDecision?: PromptRoutingDecisionSummary
  modelId?: string
  modelName?: string
  provider?: string
  error?: {
    code: string
    message: string
  }
  budgetWarnings?: string[]
}

export interface PromptTestPayload {
  agent_version_id: string
  mode: AIRunMode
  org_id?: string
  test_input: string | Record<string, unknown>
  prompt_variables?: Record<string, unknown>
  skip_routing?: boolean
}
