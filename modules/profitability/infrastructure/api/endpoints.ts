import { apiPath } from '@/shared/lib/api-paths'

export const PROFITABILITY_ENDPOINTS = {
  workspaceRateCards: {
    list: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/profitability/rate-cards`),
    create: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/profitability/rate-cards`),
    get: (workspaceId: string, id: string) =>
      apiPath(`/workspaces/${workspaceId}/profitability/rate-cards/${id}`),
    update: (workspaceId: string, id: string) =>
      apiPath(`/workspaces/${workspaceId}/profitability/rate-cards/${id}`),
    archive: (workspaceId: string, id: string) =>
      apiPath(`/workspaces/${workspaceId}/profitability/rate-cards/${id}/archive`),
  },
  projectRateCards: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/rate-cards`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/rate-cards`),
    get: (projectId: string, id: string) =>
      apiPath(`/projects/${projectId}/profitability/rate-cards/${id}`),
    update: (projectId: string, id: string) =>
      apiPath(`/projects/${projectId}/profitability/rate-cards/${id}`),
    archive: (projectId: string, id: string) =>
      apiPath(`/projects/${projectId}/profitability/rate-cards/${id}/archive`),
  },
  profile: {
    get: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/profile`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/profile`),
  },
  summary: {
    get: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/summary`),
    portal: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/summary/portal`),
    rebuild: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/summary/rebuild`),
  },
  costSources: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/cost-sources`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/cost-sources`),
    update: (projectId: string, sourceId: string) =>
      apiPath(`/projects/${projectId}/profitability/cost-sources/${sourceId}`),
    archive: (projectId: string, sourceId: string) =>
      apiPath(`/projects/${projectId}/profitability/cost-sources/${sourceId}/archive`),
  },
  revenueSources: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/revenue-sources`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/revenue-sources`),
    update: (projectId: string, sourceId: string) =>
      apiPath(`/projects/${projectId}/profitability/revenue-sources/${sourceId}`),
    archive: (projectId: string, sourceId: string) =>
      apiPath(
        `/projects/${projectId}/profitability/revenue-sources/${sourceId}/archive`),
  },
  costForecasts: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/cost-forecasts`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/cost-forecasts`),
    archive: (projectId: string, forecastId: string) =>
      apiPath(
        `/projects/${projectId}/profitability/cost-forecasts/${forecastId}/archive`),
  },
  revenueForecasts: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/revenue-forecasts`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/revenue-forecasts`),
    archive: (projectId: string, forecastId: string) =>
      apiPath(
        `/projects/${projectId}/profitability/revenue-forecasts/${forecastId}/archive`),
  },
  plans: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/plans`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/plans`),
    get: (projectId: string, planId: string) =>
      apiPath(`/projects/${projectId}/profitability/plans/${planId}`),
    versions: (projectId: string, planId: string) =>
      apiPath(`/projects/${projectId}/profitability/plans/${planId}/versions`),
    version: (projectId: string, planId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/profitability/plans/${planId}/versions/${versionId}`),
    finalizeVersion: (projectId: string, planId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/profitability/plans/${planId}/versions/${versionId}/finalize`),
  },
  adjustments: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/adjustments`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/adjustments`),
    apply: (projectId: string, adjustmentId: string) =>
      apiPath(`/projects/${projectId}/profitability/adjustments/${adjustmentId}/apply`),
  },
  thresholdPolicy: {
    get: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/threshold-policy`),
    put: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/threshold-policy`),
  },
  variance: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/variance`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/variance`),
    get: (projectId: string, varianceId: string) =>
      apiPath(`/projects/${projectId}/profitability/variance/${varianceId}`),
  },
  riskFlags: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/risk-flags`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/profitability/risk-flags`),
    mitigate: (projectId: string, id: string) =>
      apiPath(`/projects/${projectId}/profitability/risk-flags/${id}/mitigate`),
    close: (projectId: string, id: string) =>
      apiPath(`/projects/${projectId}/profitability/risk-flags/${id}/close`),
  },
} as const
