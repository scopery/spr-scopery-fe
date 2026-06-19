export type AIAgentStatus = 'active' | 'inactive' | 'deprecated'
export type AIAgentVersionStatus = 'draft' | 'testing' | 'published' | 'archived'
export type AIRunMode =
  | 'generate'
  | 'improve'
  | 'assess'
  | 'extract'
  | 'classify'
  | 'compare'
  | 'summarize'
  | 'recommend'
  | 'validate'
export type AIModelTier = 'economy' | 'standard' | 'premium' | 'frontier'
export type AIRunStatus = 'success' | 'failed' | 'cancelled' | 'skipped'

export interface AIModelPricingSummary {
  id: string
  input_price_per_1k_tokens: number
  output_price_per_1k_tokens: number
  currency: string
  effective_from: string
}

export interface AIModelSelectItem {
  id: string
  provider: string
  modelName: string
  displayName: string | null
  modelTier: AIModelTier
  supportsJson: boolean
  supportsStreaming: boolean
  supportsVision: boolean
  maxContextTokens: number | null
  maxOutputTokens: number | null
  active: boolean
  pricing: {
    id: string
    inputPricePer1kTokens: number
    outputPricePer1kTokens: number
    currency: string
    effectiveFrom: string
  } | null
}

export interface AIAgentListItem {
  id: string
  key: string
  name: string
  description: string | null
  feature: string
  category: string | null
  status: AIAgentStatus
  isSystem: boolean
  createdAt: string
  updatedAt: string
  publishedVersionId: string | null
  publishedVersionNumber: number | null
  modelId: string | null
  provider: string | null
  modelName: string | null
  modelTier: AIModelTier | null
  runsThisMonth: number
  costThisMonth: number | null
  lastRunAt: string | null
}

export interface AIAgentAdminSummary {
  totalAgents: number
  activeAgents: number
  runsThisMonth: number
  estimatedCostThisMonth: number | null
}

export interface AIAgentVersionListItem {
  id: string
  agentId: string
  versionNumber: number
  status: AIAgentVersionStatus
  modelId: string | null
  provider: string | null
  modelName: string | null
  modelTier: AIModelTier | null
  createdBy: string | null
  publishedBy: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AIAgentVersionDetail {
  id: string
  agentId: string
  versionNumber: number
  status: AIAgentVersionStatus
  modelId: string | null
  systemPrompt: string | null
  developerPrompt: string | null
  userPromptTemplate: string | null
  parametersJson: Record<string, unknown> | null
  outputSchemaJson: Record<string, unknown> | null
  createdBy: string | null
  publishedBy: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  model: AIModelSelectItem | null
}

export interface AIAgentDetail {
  id: string
  key: string
  name: string
  description: string | null
  feature: string
  category: string | null
  status: AIAgentStatus
  isSystem: boolean
  createdAt: string
  updatedAt: string
  publishedVersion: AIAgentVersionListItem | null
  versions: AIAgentVersionListItem[]
  usageThisMonth: AIUsageSummary | null
}

export interface AIUsageSummary {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  cancelledRuns: number
  skippedRuns: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalEstimatedCost: number | null
  currency: string | null
  averageLatencyMs: number | null
  averageTokensPerRun: number | null
  averageCostPerRun: number | null
  mostRecentRunAt: string | null
  failureRate: number | null
}

export interface AIRunLogItem {
  runId: string
  createdAt: string
  orgId: string | null
  projectId: string | null
  sessionId: string | null
  documentId: string | null
  userId: string | null
  agentId: string | null
  agentKey: string | null
  agentName: string | null
  agentVersionId: string | null
  modelId: string | null
  provider: string | null
  modelName: string | null
  mode: string | null
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  estimatedCost: number | null
  currency: string
  latencyMs: number | null
  status: AIRunStatus
  errorCode: string | null
  safeErrorMessage: string | null
  metadataSummary: Record<string, unknown> | null
  feedbackCount?: number
  latestFeedbackRating?: 'positive' | 'neutral' | 'negative' | null
}

export interface AIRunLogListResult {
  items: AIRunLogItem[]
  page: {
    limit: number
    offset: number
    total: number
  }
}

export interface UpdateAIAgentPayload {
  name?: string
  description?: string | null
  feature?: string
  category?: string | null
  status?: AIAgentStatus
}

export interface UpdateAIAgentVersionPayload {
  model_id?: string | null
  system_prompt?: string | null
  developer_prompt?: string | null
  user_prompt_template?: string | null
  parameters_json?: Record<string, unknown> | null
  output_schema_json?: Record<string, unknown> | null
  status?: AIAgentVersionStatus
}
