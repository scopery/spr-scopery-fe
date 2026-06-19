import { AGENT_CONTROL_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  AgentControlMetadata,
  AgentControlPreset,
  AgentPromptBinding,
  OrgAgent,
  OrgAgentListItem,
  OrgAgentRun,
  OrgAgentRuntimeMetadata,
  OrgModelPolicy,
  OrgModelPolicyListItem,
  OrgRuntimeResolution,
  OrgRuntimeUsageSummary,
  PromptPreset,
  PromptRegistryMetadata,
  PromptTemplateDetail,
  PromptTemplateListItem,
  PromptVersion,
  TemplatePromptBinding,
} from '../model/agent-control-types'

export async function getAgentControlMetadata(orgId: string): Promise<AgentControlMetadata> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.metadata(orgId))
}

export async function listAgentControlPresets(
  orgId: string
): Promise<{ items: AgentControlPreset[] }> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.presets(orgId))
}

export async function previewAgentControlPreset(
  orgId: string,
  presetKey: string
): Promise<AgentControlPreset> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.presetPreview(orgId, presetKey))
}

export async function applyAgentControlPreset(
  orgId: string,
  body: { preset_key: string; activate?: boolean }
): Promise<{ model_policies: OrgModelPolicy[]; agents: OrgAgent[] }> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.applyPreset(orgId), body)
}

export async function listOrgAgents(
  orgId: string,
  params?: {
    status?: string
    project_id?: string
    search?: string
    include_archived?: boolean
  }
): Promise<{ items: OrgAgentListItem[]; total: number }> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.agents(orgId, params))
}

export async function getOrgAgent(orgId: string, agentId: string): Promise<OrgAgentListItem> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.agent(orgId, agentId))
}

export async function createOrgAgent(
  orgId: string,
  body: {
    agent_key: string
    name: string
    purpose: string
    description?: string
    default_model_policy_id?: string | null
    allowed_context_sources?: string[]
    allowed_actions?: string[]
    allowed_tools?: string[]
    risk_level?: 'low' | 'medium' | 'high'
    status?: 'active' | 'inactive'
  }
): Promise<OrgAgent> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.createAgent(orgId), body)
}

export async function archiveOrgAgent(orgId: string, agentId: string): Promise<OrgAgent> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.archiveAgent(orgId, agentId), {})
}

export async function listOrgModelPolicies(
  orgId: string,
  params?: {
    status?: string
    search?: string
    include_archived?: boolean
  }
): Promise<{ items: OrgModelPolicyListItem[]; total: number }> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.modelPolicies(orgId, params))
}

export async function getOrgModelPolicy(
  orgId: string,
  policyId: string
): Promise<OrgModelPolicyListItem> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.modelPolicy(orgId, policyId))
}

export async function createOrgModelPolicy(
  orgId: string,
  body: {
    policy_key: string
    name: string
    provider: string
    model_name: string
    mode: string
    description?: string
    temperature?: number | null
    max_output_tokens?: number | null
    cost_tier?: string
    latency_tier?: string
    quality_tier?: string
    status?: 'active' | 'inactive'
  }
): Promise<OrgModelPolicy> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.createModelPolicy(orgId), body)
}

export async function archiveOrgModelPolicy(
  orgId: string,
  policyId: string
): Promise<OrgModelPolicy> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.archiveModelPolicy(orgId, policyId), {})
}

export async function getPromptRegistryMetadata(orgId: string): Promise<PromptRegistryMetadata> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.promptMetadata(orgId))
}

export async function listPromptPresets(orgId: string): Promise<PromptPreset[]> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.promptPresets(orgId))
}

export async function applyPromptPreset(
  orgId: string,
  presetKey: string
): Promise<{ template: PromptTemplateListItem; version: PromptVersion }> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.applyPromptPreset(orgId, presetKey), {})
}

export async function listPromptTemplates(
  orgId: string,
  params?: {
    status?: string
    category?: string
    search?: string
    include_archived?: boolean
  }
): Promise<{ items: PromptTemplateListItem[]; total: number }> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.prompts(orgId, params))
}

export async function getPromptTemplate(
  orgId: string,
  promptId: string
): Promise<PromptTemplateDetail> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.prompt(orgId, promptId))
}

export async function createPromptTemplate(
  orgId: string,
  body: {
    prompt_key: string
    name: string
    category: string
    description?: string
    status?: string
  }
): Promise<PromptTemplateListItem> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.createPrompt(orgId), body)
}

export async function createPromptVersion(
  orgId: string,
  promptId: string,
  body: {
    system_prompt?: string | null
    user_prompt_template?: string | null
    output_format?: string
    version_label?: string
    safety_notes?: string | null
    variables_json?: string[]
  }
): Promise<PromptVersion> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.createPromptVersion(orgId, promptId), body)
}

export async function setCurrentPromptVersion(
  orgId: string,
  promptId: string,
  versionId: string
): Promise<PromptTemplateListItem> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.setCurrentPromptVersion(orgId, promptId), {
    version_id: versionId,
  })
}

export async function archivePromptTemplate(
  orgId: string,
  promptId: string
): Promise<PromptTemplateListItem> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.archivePrompt(orgId, promptId), {})
}

export async function validatePromptPlaceholders(
  orgId: string,
  body: { system_prompt?: string | null; user_prompt_template?: string | null }
): Promise<{ placeholders: string[]; warnings: string[]; errors: string[] }> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.validatePlaceholders(orgId), body)
}

export async function listAgentPromptBindings(
  orgId: string,
  agentId: string
): Promise<AgentPromptBinding[]> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.agentPromptBindings(orgId, agentId))
}

export async function createAgentPromptBinding(
  orgId: string,
  agentId: string,
  body: {
    prompt_template_id: string
    binding_key: string
    prompt_version_id?: string | null
    purpose?: string | null
  }
): Promise<AgentPromptBinding> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.createAgentPromptBinding(orgId, agentId), body)
}

export async function archiveAgentPromptBinding(
  orgId: string,
  bindingId: string
): Promise<AgentPromptBinding> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.archivePromptBinding(orgId, bindingId), {})
}

export async function listTemplatePromptBindings(
  orgId: string,
  params?: { template_key?: string; deliverable_type?: string; include_archived?: boolean }
): Promise<{ items: TemplatePromptBinding[]; total: number }> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.templatePromptBindings(orgId, params))
}

export async function createTemplatePromptBinding(
  orgId: string,
  body: {
    prompt_template_id: string
    binding_key: string
    template_key?: string | null
    deliverable_type?: string | null
    section_type?: string | null
    prompt_version_id?: string | null
  }
): Promise<TemplatePromptBinding> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.createTemplatePromptBinding(orgId), body)
}

export async function archiveTemplatePromptBinding(
  orgId: string,
  bindingId: string
): Promise<TemplatePromptBinding> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.archiveTemplatePromptBinding(orgId, bindingId), {})
}

export async function getRuntimeMetadata(orgId: string): Promise<OrgAgentRuntimeMetadata> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.runtimeMetadata(orgId))
}

export async function previewRuntimeResolution(
  orgId: string,
  body: {
    feature_key: string
    project_id?: string
    org_agent_key?: string
    binding_key?: string
    requested_mode?: string
  }
): Promise<OrgRuntimeResolution> {
  return apiClient.post(AGENT_CONTROL_ENDPOINTS.runtimeResolvePreview(orgId), body)
}

export async function listOrgAgentRuns(
  orgId: string,
  params?: {
    project_id?: string
    feature_key?: string
    status?: string
    provider?: string
    model_name?: string
    limit?: number
    offset?: number
  }
): Promise<{ items: OrgAgentRun[]; total: number }> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.runtimeRuns(orgId, params))
}

export async function getRuntimeUsageSummary(
  orgId: string,
  params?: { project_id?: string; from_date?: string; to_date?: string }
): Promise<OrgRuntimeUsageSummary> {
  return apiClient.get(AGENT_CONTROL_ENDPOINTS.runtimeUsageSummary(orgId, params))
}

export type {
  AgentControlMetadata,
  AgentControlPreset,
  AgentPromptBinding,
  OrgAgent,
  OrgAgentListItem,
  OrgAgentRun,
  OrgAgentRuntimeMetadata,
  OrgModelPolicy,
  OrgModelPolicyListItem,
  OrgRuntimeResolution,
  OrgRuntimeUsageSummary,
  PromptPreset,
  PromptRegistryMetadata,
  PromptTemplateDetail,
  PromptTemplateListItem,
  PromptVersion,
  TemplatePromptBinding,
} from '../model/agent-control-types'
