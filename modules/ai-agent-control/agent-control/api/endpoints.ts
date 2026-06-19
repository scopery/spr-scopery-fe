/**
 * Org Agent Control API endpoints.
 */
import { v2 } from '@/shared/lib/api-paths'

export const AGENT_CONTROL_ENDPOINTS = {
  metadata: (orgId: string) => v2(`/orgs/${orgId}/agent-control/metadata`),
  presets: (orgId: string) => v2(`/orgs/${orgId}/agent-control/presets`),
  presetPreview: (orgId: string, presetKey: string) =>
    v2(`/orgs/${orgId}/agent-control/presets/${encodeURIComponent(presetKey)}/preview`),
  applyPreset: (orgId: string) => v2(`/orgs/${orgId}/agent-control/presets/apply`),
  agents: (
    orgId: string,
    params?: {
      status?: string
      project_id?: string
      search?: string
      include_archived?: boolean
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.search) p.set('search', params.search)
    if (params?.include_archived != null) p.set('include_archived', String(params.include_archived))
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/agent-control/agents`) + (q ? `?${q}` : '')
  },
  createAgent: (orgId: string) => v2(`/orgs/${orgId}/agent-control/agents`),
  agent: (orgId: string, agentId: string) => v2(`/orgs/${orgId}/agent-control/agents/${agentId}`),
  archiveAgent: (orgId: string, agentId: string) =>
    v2(`/orgs/${orgId}/agent-control/agents/${agentId}/archive`),
  modelPolicies: (
    orgId: string,
    params?: {
      status?: string
      project_id?: string
      search?: string
      include_archived?: boolean
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.search) p.set('search', params.search)
    if (params?.include_archived != null) p.set('include_archived', String(params.include_archived))
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/agent-control/model-policies`) + (q ? `?${q}` : '')
  },
  createModelPolicy: (orgId: string) => v2(`/orgs/${orgId}/agent-control/model-policies`),
  modelPolicy: (orgId: string, policyId: string) =>
    v2(`/orgs/${orgId}/agent-control/model-policies/${policyId}`),
  archiveModelPolicy: (orgId: string, policyId: string) =>
    v2(`/orgs/${orgId}/agent-control/model-policies/${policyId}/archive`),
  promptMetadata: (orgId: string) => v2(`/orgs/${orgId}/agent-control/prompt-metadata`),
  validatePlaceholders: (orgId: string) =>
    v2(`/orgs/${orgId}/agent-control/prompts/validate-placeholders`),
  promptPresets: (orgId: string) => v2(`/orgs/${orgId}/agent-control/prompt-presets`),
  promptPresetPreview: (orgId: string, presetKey: string) =>
    v2(`/orgs/${orgId}/agent-control/prompt-presets/${encodeURIComponent(presetKey)}/preview`),
  applyPromptPreset: (orgId: string, presetKey: string) =>
    v2(`/orgs/${orgId}/agent-control/prompt-presets/${encodeURIComponent(presetKey)}/apply`),
  prompts: (
    orgId: string,
    params?: {
      status?: string
      category?: string
      search?: string
      include_archived?: boolean
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.category) p.set('category', params.category)
    if (params?.search) p.set('search', params.search)
    if (params?.include_archived != null) p.set('include_archived', String(params.include_archived))
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/agent-control/prompts`) + (q ? `?${q}` : '')
  },
  createPrompt: (orgId: string) => v2(`/orgs/${orgId}/agent-control/prompts`),
  prompt: (orgId: string, promptId: string) =>
    v2(`/orgs/${orgId}/agent-control/prompts/${promptId}`),
  archivePrompt: (orgId: string, promptId: string) =>
    v2(`/orgs/${orgId}/agent-control/prompts/${promptId}/archive`),
  createPromptVersion: (orgId: string, promptId: string) =>
    v2(`/orgs/${orgId}/agent-control/prompts/${promptId}/versions`),
  setCurrentPromptVersion: (orgId: string, promptId: string) =>
    v2(`/orgs/${orgId}/agent-control/prompts/${promptId}/set-current-version`),
  promptVersion: (orgId: string, versionId: string) =>
    v2(`/orgs/${orgId}/agent-control/prompt-versions/${versionId}`),
  agentPromptBindings: (orgId: string, agentId: string) =>
    v2(`/orgs/${orgId}/agent-control/agents/${agentId}/prompt-bindings`),
  createAgentPromptBinding: (orgId: string, agentId: string) =>
    v2(`/orgs/${orgId}/agent-control/agents/${agentId}/prompt-bindings`),
  archivePromptBinding: (orgId: string, bindingId: string) =>
    v2(`/orgs/${orgId}/agent-control/prompt-bindings/${bindingId}/archive`),
  templatePromptBindings: (
    orgId: string,
    params?: { template_key?: string; deliverable_type?: string; include_archived?: boolean }
  ) => {
    const p = new URLSearchParams()
    if (params?.template_key) p.set('template_key', params.template_key)
    if (params?.deliverable_type) p.set('deliverable_type', params.deliverable_type)
    if (params?.include_archived != null) p.set('include_archived', String(params.include_archived))
    const q = p.toString()
    return v2(`/orgs/${orgId}/agent-control/template-prompt-bindings`) + (q ? `?${q}` : '')
  },
  createTemplatePromptBinding: (orgId: string) =>
    v2(`/orgs/${orgId}/agent-control/template-prompt-bindings`),
  archiveTemplatePromptBinding: (orgId: string, bindingId: string) =>
    v2(`/orgs/${orgId}/agent-control/template-prompt-bindings/${bindingId}/archive`),
  runtimeMetadata: (orgId: string) => v2(`/orgs/${orgId}/agent-control/runtime/metadata`),
  runtimeResolvePreview: (orgId: string) =>
    v2(`/orgs/${orgId}/agent-control/runtime/resolve-preview`),
  runtimeRuns: (
    orgId: string,
    params?: {
      project_id?: string
      feature_key?: string
      status?: string
      provider?: string
      model_name?: string
      from_date?: string
      to_date?: string
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.feature_key) p.set('feature_key', params.feature_key)
    if (params?.status) p.set('status', params.status)
    if (params?.provider) p.set('provider', params.provider)
    if (params?.model_name) p.set('model_name', params.model_name)
    if (params?.from_date) p.set('from_date', params.from_date)
    if (params?.to_date) p.set('to_date', params.to_date)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/agent-control/runtime/runs`) + (q ? `?${q}` : '')
  },
  runtimeRun: (orgId: string, runId: string) =>
    v2(`/orgs/${orgId}/agent-control/runtime/runs/${runId}`),
  runtimeUsageSummary: (
    orgId: string,
    params?: { project_id?: string; from_date?: string; to_date?: string }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.from_date) p.set('from_date', params.from_date)
    if (params?.to_date) p.set('to_date', params.to_date)
    const q = p.toString()
    return v2(`/orgs/${orgId}/agent-control/runtime/usage-summary`) + (q ? `?${q}` : '')
  },
  runtimeCostCatalog: (orgId: string) => v2(`/orgs/${orgId}/agent-control/runtime/cost-catalog`),
} as const
