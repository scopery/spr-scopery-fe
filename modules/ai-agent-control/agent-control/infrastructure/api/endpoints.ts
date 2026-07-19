import { apiPath } from '@/shared/lib/api-paths'

/**
 * Agent Control endpoints — aligned to BE `AiAgentApiPaths` (`/api/ai-agent/...`).
 * `orgId` args are kept for call-site compatibility but are unused in the path
 * (platform-global AI agent APIs).
 */
export const AGENT_CONTROL_ENDPOINTS = {
  /* --- Presets (not on current BE — soft-fail callers) --- */
  metadata: (_orgId: string) => apiPath('/ai-agent/agents'),
  presets: (_orgId: string) => apiPath('/ai-agent/agents'),
  presetPreview: (_orgId: string, _presetKey: string) => apiPath('/ai-agent/agents'),
  applyPreset: (_orgId: string) => apiPath('/ai-agent/agents'),

  /* --- Agents --- */
  agents: (
    _orgId: string,
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
    if (params?.search) p.set('search', params.search)
    if (params?.limit != null) p.set('size', String(params.limit))
    if (params?.offset != null) p.set('page', String(Math.floor(params.offset / (params.limit || 20))))
    const q = p.toString()
    return apiPath('/ai-agent/agents') + (q ? `?${q}` : '')
  },
  createAgent: (_orgId: string) => apiPath('/ai-agent/agents'),
  agent: (_orgId: string, agentId: string) => apiPath(`/ai-agent/agents/${agentId}`),
  archiveAgent: (_orgId: string, agentId: string) =>
    apiPath(`/ai-agent/agents/${agentId}/archive`),

  /* --- Usage policies (was model-policies) --- */
  modelPolicies: (
    _orgId: string,
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
    if (params?.search) p.set('search', params.search)
    if (params?.limit != null) p.set('size', String(params.limit))
    const q = p.toString()
    return apiPath('/ai-agent/usage-policies') + (q ? `?${q}` : '')
  },
  createModelPolicy: (_orgId: string) => apiPath('/ai-agent/usage-policies'),
  modelPolicy: (_orgId: string, policyId: string) =>
    apiPath(`/ai-agent/usage-policies/${policyId}`),
  archiveModelPolicy: (_orgId: string, policyId: string) =>
    apiPath(`/ai-agent/usage-policies/${policyId}/archive`),

  /* --- Prompt templates (was prompts) --- */
  promptMetadata: (_orgId: string) => apiPath('/ai-agent/prompt-templates'),
  validatePlaceholders: (_orgId: string) => apiPath('/ai-agent/prompt-templates'),
  promptPresets: (_orgId: string) => apiPath('/ai-agent/prompt-templates'),
  promptPresetPreview: (_orgId: string, _presetKey: string) =>
    apiPath('/ai-agent/prompt-templates'),
  applyPromptPreset: (_orgId: string, _presetKey: string) =>
    apiPath('/ai-agent/prompt-templates'),
  prompts: (
    _orgId: string,
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
    if (params?.search) p.set('search', params.search)
    if (params?.limit != null) p.set('size', String(params.limit))
    const q = p.toString()
    return apiPath('/ai-agent/prompt-templates') + (q ? `?${q}` : '')
  },
  createPrompt: (_orgId: string) => apiPath('/ai-agent/prompt-templates'),
  prompt: (_orgId: string, promptId: string) =>
    apiPath(`/ai-agent/prompt-templates/${promptId}`),
  archivePrompt: (_orgId: string, promptId: string) =>
    apiPath(`/ai-agent/prompt-templates/${promptId}/archive`),
  createPromptVersion: (_orgId: string, promptId: string) =>
    apiPath(`/ai-agent/prompt-templates/${promptId}/versions`),
  setCurrentPromptVersion: (_orgId: string, promptId: string) =>
    apiPath(`/ai-agent/prompt-templates/${promptId}/set-current-version`),
  promptVersion: (_orgId: string, versionId: string) =>
    apiPath(`/ai-agent/prompt-versions/${versionId}`),

  /* --- Bindings / runtime (partial BE coverage) --- */
  agentPromptBindings: (_orgId: string, agentId: string) =>
    apiPath(`/ai-agent/agents/${agentId}`),
  createAgentPromptBinding: (_orgId: string, agentId: string) =>
    apiPath(`/ai-agent/agents/${agentId}`),
  archivePromptBinding: (_orgId: string, _bindingId: string) =>
    apiPath('/ai-agent/agents'),
  templatePromptBindings: (
    _orgId: string,
    _params?: { template_key?: string; deliverable_type?: string; include_archived?: boolean }
  ) => apiPath('/ai-agent/prompt-templates'),
  createTemplatePromptBinding: (_orgId: string) => apiPath('/ai-agent/prompt-templates'),
  archiveTemplatePromptBinding: (_orgId: string, _bindingId: string) =>
    apiPath('/ai-agent/prompt-templates'),

  runtimeMetadata: (_orgId: string) => apiPath('/ai-agent/executions'),
  runtimeResolvePreview: (_orgId: string) => apiPath('/ai-agent/executions'),
  runtimeRuns: (
    _orgId: string,
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
    if (params?.status) p.set('status', params.status)
    if (params?.limit != null) p.set('size', String(params.limit))
    const q = p.toString()
    return apiPath('/ai-agent/executions') + (q ? `?${q}` : '')
  },
  runtimeRun: (_orgId: string, runId: string) => apiPath(`/ai-agent/executions/${runId}`),
  runtimeUsageSummary: (
    _orgId: string,
    _params?: { project_id?: string; from_date?: string; to_date?: string }
  ) => apiPath('/ai-agent/execution-logs'),
  runtimeCostCatalog: (_orgId: string) => apiPath('/ai-agent/models'),
} as const
