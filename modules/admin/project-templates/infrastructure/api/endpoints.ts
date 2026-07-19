import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const PROJECT_TEMPLATE_ENDPOINTS = {
  list: (params?: {
    scope?: string
    workspaceId?: string
    organizationId?: string
    status?: string
    category?: string
    keyword?: string
    page?: number
    size?: number
  }) => withQuery(apiPath('/project/templates'), params),
  get: (templateId: string) => apiPath(`/project/templates/${templateId}`),
  activate: (templateId: string) => apiPath(`/project/templates/${templateId}/activate`),
  deactivate: (templateId: string) =>
    apiPath(`/project/templates/${templateId}/deactivate`),
  archive: (templateId: string) => apiPath(`/project/templates/${templateId}/archive`),
  versions: (templateId: string) =>
    apiPath(`/project/templates/${templateId}/versions`),
  version: (templateId: string, versionId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}`),
  publishVersion: (templateId: string, versionId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}/publish`),
  apply: (templateId: string, versionId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}/apply`),
  phases: (templateId: string, versionId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}/phases`),
  phase: (templateId: string, versionId: string, phaseId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}/phases/${phaseId}`),
  tasks: (templateId: string, versionId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}/tasks`),
  task: (templateId: string, versionId: string, taskId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}/tasks/${taskId}`),
  taskDependencies: (templateId: string, versionId: string) =>
    apiPath(`/project/templates/${templateId}/versions/${versionId}/task-dependencies`),
  taskDependency: (templateId: string, versionId: string, dependencyId: string) =>
    apiPath(
      `/project/templates/${templateId}/versions/${versionId}/task-dependencies/${dependencyId}`),
} as const
