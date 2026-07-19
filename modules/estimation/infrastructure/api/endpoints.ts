import { apiPath } from '@/shared/lib/api-paths'

export const ESTIMATION_ENDPOINTS = {
  runs: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/estimation-runs`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/estimation-runs`),
    get: (projectId: string, runId: string) =>
      apiPath(`/projects/${projectId}/estimation-runs/${runId}`),
    cancel: (projectId: string, runId: string) =>
      apiPath(`/projects/${projectId}/estimation-runs/${runId}/cancel`),
    markCurrent: (projectId: string, runId: string) =>
      apiPath(`/projects/${projectId}/estimation-runs/${runId}/mark-current`),
    tasks: (projectId: string, runId: string) =>
      apiPath(`/projects/${projectId}/estimation-runs/${runId}/tasks`),
    wbsRollups: (projectId: string, runId: string) =>
      apiPath(`/projects/${projectId}/estimation-runs/${runId}/wbs-rollups`),
    phaseRollups: (projectId: string, runId: string) =>
      apiPath(`/projects/${projectId}/estimation-runs/${runId}/phase-rollups`),
    summary: (projectId: string, runId: string) =>
      apiPath(`/projects/${projectId}/estimation-runs/${runId}/summary`),
  },
  current: {
    get: (projectId: string) => apiPath(`/projects/${projectId}/estimation/current`),
    tasks: (projectId: string) =>
      apiPath(`/projects/${projectId}/estimation/current/tasks`),
    wbsRollups: (projectId: string) =>
      apiPath(`/projects/${projectId}/estimation/current/wbs-rollups`),
    phaseRollups: (projectId: string) =>
      apiPath(`/projects/${projectId}/estimation/current/phase-rollups`),
    summary: (projectId: string) =>
      apiPath(`/projects/${projectId}/estimation/current/summary`),
  },
  previewRateImpact: (projectId: string) =>
    apiPath(`/projects/${projectId}/estimation/preview-rate-impact`),
} as const
