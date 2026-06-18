export type OrgAgentStatus = 'active' | 'inactive' | 'archived'
export type OrgModelPolicyStatus = 'active' | 'inactive' | 'archived'
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure_openai' | 'other'
export type AIPolicyMode =
  | 'cheap'
  | 'balanced'
  | 'high_quality'
  | 'reasoning'
  | 'vision'
  | 'extraction'
  | 'classification'
  | 'writing'
  | 'planning'
export type AIRiskLevel = 'low' | 'medium' | 'high'
export type AITierLevel = 'low' | 'medium' | 'high'
export type AIQualityTier = 'standard' | 'advanced' | 'premium'

export interface OrgAgent {
  id: string
  org_id: string
  project_id: string | null
  agent_key: string
  name: string
  description: string | null
  purpose: string
  status: OrgAgentStatus
  default_model_policy_id: string | null
  allowed_context_sources: string[]
  allowed_actions: string[]
  allowed_tools: string[]
  output_contract: Record<string, unknown> | null
  risk_level: AIRiskLevel
  preset_key: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface OrgAgentListItem extends OrgAgent {
  default_model_policy_key: string | null
  default_model_policy_name: string | null
}

export interface OrgModelPolicy {
  id: string
  org_id: string
  project_id: string | null
  policy_key: string
  name: string
  description: string | null
  provider: AIProvider
  model_name: string
  mode: AIPolicyMode
  temperature: number | null
  max_output_tokens: number | null
  max_input_tokens: number | null
  fallback_policy_id: string | null
  cost_tier: AITierLevel
  latency_tier: AITierLevel
  quality_tier: AIQualityTier
  status: OrgModelPolicyStatus
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface OrgModelPolicyListItem extends OrgModelPolicy {
  fallback_policy_key: string | null
  fallback_policy_name: string | null
}

export interface AgentControlMetadata {
  providers: string[]
  modes: string[]
  risk_levels: string[]
  tier_levels: string[]
  quality_tiers: string[]
  context_sources: string[]
  allowed_actions: string[]
  allowed_tools: string[]
  model_catalog: Array<{
    provider: string
    model_name: string
    display_name: string
    supports_json: boolean
    supports_tools: boolean
    supports_vision: boolean
    supports_large_context: boolean
    default_context_window: number
  }>
}

export interface AgentControlPreset {
  preset_key: string
  name: string
  description: string
  model_policies: Array<{
    policy_key: string
    name: string
    description: string
    provider: AIProvider
    model_name: string
    mode: AIPolicyMode
    temperature: number | null
    max_output_tokens: number | null
    cost_tier: AITierLevel
    latency_tier: AITierLevel
    quality_tier: AIQualityTier
  }>
  agents: Array<{
    agent_key: string
    name: string
    description: string
    purpose: string
    risk_level: AIRiskLevel
    default_model_policy_key: string
    allowed_context_sources: string[]
    allowed_actions: string[]
    allowed_tools: string[]
  }>
}

export type PromptTemplateStatus = 'draft' | 'active' | 'inactive' | 'archived'
export type PromptCategory =
  | 'planning'
  | 'writing'
  | 'extraction'
  | 'classification'
  | 'validation'
  | 'summarization'
  | 'rewriting'
  | 'governance_explanation'
  | 'template_section'
  | 'other'
export type PromptOutputFormat =
  | 'text'
  | 'markdown'
  | 'json'
  | 'structured_json'
  | 'plate_json'
  | 'bullet_list'

export interface PromptTemplateListItem {
  id: string
  org_id: string
  project_id: string | null
  prompt_key: string
  name: string
  description: string | null
  category: PromptCategory
  status: PromptTemplateStatus
  current_version_id: string | null
  current_version_number: number | null
  current_output_format: PromptOutputFormat | null
  binding_count: number
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface PromptVersion {
  id: string
  org_id: string
  prompt_template_id: string
  version_number: number
  version_label: string | null
  system_prompt: string | null
  user_prompt_template: string | null
  output_format: PromptOutputFormat
  output_schema_json: Record<string, unknown> | null
  variables_json: string[]
  safety_notes: string | null
  status: string
  created_at: string
  archived_at: string | null
}

export interface PromptTemplateDetail extends PromptTemplateListItem {
  versions: PromptVersion[]
}

export interface PromptRegistryMetadata {
  categories: string[]
  output_formats: string[]
  template_statuses: string[]
  version_statuses: string[]
  binding_statuses: string[]
  binding_keys: string[]
  variable_prefixes: string[]
  standalone_variables: string[]
  deliverable_types: string[]
}

export interface PromptPreset {
  preset_key: string
  prompt_key: string
  name: string
  description: string
  category: PromptCategory
  output_format: PromptOutputFormat
}

export interface AgentPromptBinding {
  id: string
  org_id: string
  agent_id: string
  prompt_template_id: string
  prompt_version_id: string | null
  binding_key: string
  purpose: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface TemplatePromptBinding {
  id: string
  org_id: string
  template_key: string | null
  document_type: string | null
  deliverable_type: string | null
  section_type: string | null
  prompt_template_id: string
  prompt_version_id: string | null
  binding_key: string
  status: string
  created_at: string
  updated_at: string
}

export interface OrgAgentRuntimeMetadata {
  feature_keys: string[]
  resolution_sources: string[]
  run_statuses: string[]
  org_runtime_enabled: boolean
  org_runtime_strict: boolean
  budget_enforcement: 'deferred'
}

export interface OrgRuntimeResolution {
  resolution_source: string
  org_agent_id: string | null
  org_agent_key: string | null
  model_policy_id: string | null
  provider: string
  model_name: string
  mode: string | null
  prompt_template_id: string | null
  prompt_version_id: string | null
  system_prompt: string | null
  user_prompt_template: string | null
  fallback_reason: string | null
  warnings: string[]
}

export interface OrgAgentRun {
  id: string
  org_id: string
  project_id: string | null
  feature_key: string
  org_agent_key: string | null
  provider: string
  model_name: string
  mode: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  estimated_cost: number | null
  currency: string
  latency_ms: number | null
  status: string
  fallback_reason: string | null
  created_at: string
}

export interface OrgRuntimeUsageSummary {
  total_runs: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  estimated_cost_total: number | null
  currency: string
  by_feature: Array<{
    feature_key: string
    run_count: number
    total_tokens: number
    estimated_cost: number | null
  }>
  by_model: Array<{
    provider: string
    model_name: string
    run_count: number
    total_tokens: number
    estimated_cost: number | null
  }>
  warnings: string[]
}
