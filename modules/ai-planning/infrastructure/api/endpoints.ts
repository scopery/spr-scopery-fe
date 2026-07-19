import { apiPath } from '@/shared/lib/api-paths'

export const AI_PLANNING_ENDPOINTS = {
  runs: (projectId: string) => apiPath(`/projects/${projectId}/ai-planning/runs`),
  run: (projectId: string, runId: string) =>
    apiPath(`/projects/${projectId}/ai-planning/runs/${runId}`),
  suggestions: (projectId: string, runId: string) =>
    apiPath(`/projects/${projectId}/ai-planning/runs/${runId}/suggestions`),
  applyPreview: (projectId: string, suggestionId: string) =>
    apiPath(
      `/projects/${projectId}/ai-planning/suggestions/${suggestionId}/apply-preview`),
  accept: (projectId: string, suggestionId: string) =>
    apiPath(`/projects/${projectId}/ai-planning/suggestions/${suggestionId}/accept`),
  reject: (projectId: string, suggestionId: string) =>
    apiPath(`/projects/${projectId}/ai-planning/suggestions/${suggestionId}/reject`),
  apply: (projectId: string, suggestionId: string) =>
    apiPath(`/projects/${projectId}/ai-planning/suggestions/${suggestionId}/apply`),
} as const
