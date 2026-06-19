/** Admin route path helpers. */
export const ADMIN_ROUTES = {
  templates: '/admin/templates',
  templateNew: '/admin/templates/new',
  template: (templateId: string) => `/admin/templates/${templateId}`,
  aiAgents: '/admin/ai-agents',
  aiBudgets: '/admin/ai-budgets',
  aiAgent: (agentId: string) => `/admin/ai-agents/${agentId}`,
  aiAgentVersion: (agentId: string, versionId: string) =>
    `/admin/ai-agents/${agentId}/versions/${versionId}`,
} as const
