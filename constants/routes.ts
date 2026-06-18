/**
 * Route path helpers — simplified MVP flow
 *
 * Removed routes (pages still exist but return notFound()):
 *   impact, trace, landscape, actors, requirements, projectMembers
 */

export const ROUTES = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    callback: '/auth/callback',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  suspended: '/suspended',
  onboarding: '/onboarding',
  invites: (token: string) => `/invites/${token}`,
  admin: {
    templates: '/admin/templates',
    templateNew: '/admin/templates/new',
    template: (templateId: string) => `/admin/templates/${templateId}`,
    aiAgents: '/admin/ai-agents',
    aiBudgets: '/admin/ai-budgets',
    aiAgent: (agentId: string) => `/admin/ai-agents/${agentId}`,
    aiAgentVersion: (agentId: string, versionId: string) =>
      `/admin/ai-agents/${agentId}/versions/${versionId}`,
  },
  org: {
    root: (orgId: string) => `/org/${orgId}`,
    projects: (orgId: string) => `/org/${orgId}/projects`,
    members: (orgId: string) => `/org/${orgId}/members`,
    project: (orgId: string, projectId: string) => `/org/${orgId}/projects/${projectId}`,
    projectQuestions: (orgId: string, projectId: string) => `/org/${orgId}/projects/${projectId}/questions`,
    projectDocuments: (orgId: string, projectId: string) => `/org/${orgId}/projects/${projectId}/documents`,
    document: (orgId: string, documentId: string, projectId?: string) => {
      const base = `/org/${orgId}/documents/${documentId}`
      if (projectId) return `${base}?projectId=${encodeURIComponent(projectId)}`
      return base
    },
    sessions: (orgId: string, projectId: string) => `/org/${orgId}/projects/${projectId}/sessions`,
    session: (orgId: string, projectId: string, sessionId: string) =>
      `/org/${orgId}/projects/${projectId}/sessions/${sessionId}`,
    settings: (orgId: string) => `/org/${orgId}/settings/controlled-lists`,
    settingsTemplates: (orgId: string) => `/org/${orgId}/settings/templates`,
    settingsTemplateNew: (orgId: string) => `/org/${orgId}/settings/templates/new`,
    settingsTemplate: (orgId: string, templateId: string) =>
      `/org/${orgId}/settings/templates/${templateId}`,
    documentHub: (orgId: string) => `/org/${orgId}/document-hub`,
    settingsControlledLists: (orgId: string, projectId?: string | null) =>
      `/org/${orgId}/settings/controlled-lists${projectId ? `?project=${projectId}` : ''}`,
    settingsControlledListDetail: (orgId: string, listId: string, projectId?: string | null) =>
      `/org/${orgId}/settings/controlled-lists/${listId}${projectId ? `?project=${projectId}` : ''}`,
    governance: (orgId: string) => `/org/${orgId}/governance`,
    governancePolicy: (orgId: string, policyId: string) =>
      `/org/${orgId}/governance/${policyId}`,
    agentControl: (orgId: string) => `/org/${orgId}/agent-control`,
  },
} as const
