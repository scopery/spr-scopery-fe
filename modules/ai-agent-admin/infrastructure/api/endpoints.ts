import { apiPath } from '@/shared/lib/api-paths'

/**
 * AI Agent Admin endpoints — Wave 5 contract (`/api/ai-agent/...`).
 * Do not rewrite to `/api/v1/ai-agent`.
 */

function withSearch(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const p = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value == null || value === '') continue
      p.set(key, String(value))
    }
  }
  const q = p.toString()
  return path + (q ? `?${q}` : '')
}

type PageParams = {
  page?: number
  size?: number
  search?: string
  keyword?: string
  q?: string
  status?: string
  type?: string
  category?: string
  providerId?: string
  modelId?: string
  environment?: string
  isDefault?: boolean
  parameterName?: string
  supportStatus?: string
  valueType?: string
  secretType?: string
  outputFormat?: string
  agentId?: string
  templateId?: string
  contentFormat?: string
  eventDefinitionId?: string
  triggerType?: string
  targetType?: string
  requestId?: string
  eventConfigId?: string
  promptVersionId?: string
  modelDeploymentId?: string
  triggerSource?: string
  createdFrom?: string
  createdTo?: string
}

export const AI_AGENT_ADMIN_ENDPOINTS = {
  /* E. Providers */
  providers: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/providers'), params),
  provider: (id: string) => apiPath(`/ai-agent/providers/${id}`),
  activateProvider: (id: string) => apiPath(`/ai-agent/providers/${id}/activate`),
  deactivateProvider: (id: string) =>
    apiPath(`/ai-agent/providers/${id}/deactivate`),

  /* F. Provider secrets */
  providerSecrets: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/provider-secrets'), params),
  providerSecret: (id: string) => apiPath(`/ai-agent/provider-secrets/${id}`),
  rotateProviderSecret: (id: string) =>
    apiPath(`/ai-agent/provider-secrets/${id}/rotate`),
  deactivateProviderSecret: (id: string) =>
    apiPath(`/ai-agent/provider-secrets/${id}/deactivate`),

  /* G. Models */
  models: (params?: PageParams) => withSearch(apiPath('/ai-agent/models'), params),
  model: (id: string) => apiPath(`/ai-agent/models/${id}`),
  activateModel: (id: string) => apiPath(`/ai-agent/models/${id}/activate`),
  deactivateModel: (id: string) => apiPath(`/ai-agent/models/${id}/deactivate`),

  /* H. Model deployments */
  modelDeployments: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/model-deployments'), params),
  modelDeployment: (id: string) => apiPath(`/ai-agent/model-deployments/${id}`),
  activateModelDeployment: (id: string) =>
    apiPath(`/ai-agent/model-deployments/${id}/activate`),
  deactivateModelDeployment: (id: string) =>
    apiPath(`/ai-agent/model-deployments/${id}/deactivate`),
  setDefaultModelDeployment: (id: string) =>
    apiPath(`/ai-agent/model-deployments/${id}/set-default`),

  /* I. Parameter capabilities */
  parameterCapabilities: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/model-parameter-capabilities'), params),
  parameterCapability: (id: string) =>
    apiPath(`/ai-agent/model-parameter-capabilities/${id}`),
  activateParameterCapability: (id: string) =>
    apiPath(`/ai-agent/model-parameter-capabilities/${id}/activate`),
  deactivateParameterCapability: (id: string) =>
    apiPath(`/ai-agent/model-parameter-capabilities/${id}/deactivate`),

  /* J. Agents */
  agents: (params?: PageParams) => withSearch(apiPath('/ai-agent/agents'), params),
  agent: (id: string) => apiPath(`/ai-agent/agents/${id}`),
  activateAgent: (id: string) => apiPath(`/ai-agent/agents/${id}/activate`),
  deactivateAgent: (id: string) => apiPath(`/ai-agent/agents/${id}/deactivate`),

  /* K. Prompt templates */
  promptTemplates: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/prompt-templates'), params),
  promptTemplate: (id: string) => apiPath(`/ai-agent/prompt-templates/${id}`),
  activatePromptTemplate: (id: string) =>
    apiPath(`/ai-agent/prompt-templates/${id}/activate`),
  deactivatePromptTemplate: (id: string) =>
    apiPath(`/ai-agent/prompt-templates/${id}/deactivate`),

  /* L. Prompt versions */
  promptVersions: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/prompt-versions'), params),
  promptVersion: (id: string) => apiPath(`/ai-agent/prompt-versions/${id}`),
  activatePromptVersion: (id: string) =>
    apiPath(`/ai-agent/prompt-versions/${id}/activate`),
  archivePromptVersion: (id: string) =>
    apiPath(`/ai-agent/prompt-versions/${id}/archive`),

  /* M. Event configs */
  eventConfigs: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/event-configs'), params),
  eventConfig: (id: string) => apiPath(`/ai-agent/event-configs/${id}`),
  resolveEventConfig: (params: {
    eventDefinitionId?: string
    eventCode?: string
    sourceSystem?: string
    eventKey?: string
    environment?: string
  }) => withSearch(apiPath('/ai-agent/event-configs/resolve'), params),
  activateEventConfig: (id: string) =>
    apiPath(`/ai-agent/event-configs/${id}/activate`),
  deactivateEventConfig: (id: string) =>
    apiPath(`/ai-agent/event-configs/${id}/deactivate`),

  /* N. Usage policies */
  usagePolicies: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/usage-policies'), params),
  usagePolicy: (id: string) => apiPath(`/ai-agent/usage-policies/${id}`),
  activateUsagePolicy: (id: string) =>
    apiPath(`/ai-agent/usage-policies/${id}/activate`),
  deactivateUsagePolicy: (id: string) =>
    apiPath(`/ai-agent/usage-policies/${id}/deactivate`),

  /* O. Executions (UI-facing triggers only) */
  executeByEvent: () => apiPath('/ai-agent/executions/event'),
  executeByEventConfig: (eventConfigId: string) =>
    apiPath(`/ai-agent/executions/event-config/${eventConfigId}`),

  /**
   * P. Execution logs — GET only from browser.
   * Transition mutations are SERVICE_ORCHESTRATED (W5-GAP-06) — not exported for FE use.
   */
  executionLogs: (params?: PageParams) =>
    withSearch(apiPath('/ai-agent/execution-logs'), params),
  executionLog: (id: string) => apiPath(`/ai-agent/execution-logs/${id}`),

  /* Q. Playground */
  playgroundOptions: (params?: {
    includeEventConfigs?: boolean
    includeAgents?: boolean
    includePromptVersions?: boolean
    includeModelDeployments?: boolean
  }) => withSearch(apiPath('/ai-agent/playground/options'), params),
  playgroundEventConfigRun: (eventConfigId: string) =>
    apiPath(`/ai-agent/playground/event-config/${eventConfigId}/run`),
  playgroundDirectRun: () => apiPath('/ai-agent/playground/direct/run'),
  playgroundPromptPreview: () => apiPath('/ai-agent/playground/prompt/preview'),

  /* S. AI Assistant workspace config (admin) */
  aiAssistantWorkspaceConfig: (workspaceId: string) =>
    `/api/v1/admin/ai-assistant/workspace-configs/${workspaceId}`,

  /* T. AI Assistant Knowledge base (admin guide definitions) */
  aiAssistantGuides: () => `/api/proxy/v1/admin/ai-assistant/guides`,
  aiAssistantGuide: (id: string) => `/api/proxy/v1/admin/ai-assistant/guides/${id}`,

  /* R. Tools */
  tools: (params?: PageParams) => withSearch(apiPath('/ai-agent/tools'), params),
  tool: (id: string) => apiPath(`/ai-agent/tools/${id}`),
  activateTool: (id: string) => apiPath(`/ai-agent/tools/${id}/activate`),
  deactivateTool: (id: string) => apiPath(`/ai-agent/tools/${id}/deactivate`),
  toolPermissions: (id: string) => apiPath(`/ai-agent/tools/${id}/permissions`),
  toolPermission: (toolId: string, permissionId: string) =>
    apiPath(`/ai-agent/tools/${toolId}/permissions/${permissionId}`),
  toolBindings: (id: string) => apiPath(`/ai-agent/tools/${id}/bindings`),
  toolBinding: (toolId: string, agentId: string) =>
    apiPath(`/ai-agent/tools/${toolId}/bindings/${agentId}`),
  executeTool: (id: string) => apiPath(`/ai-agent/tools/${id}/execute`),
} as const
