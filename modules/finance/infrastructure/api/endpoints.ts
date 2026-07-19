import { apiPath } from '@/shared/lib/api-paths'

export const FINANCE_ENDPOINTS = {
  scenarios: {
    list: (projectId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios`),
    create: (projectId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios`),
    get: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}`),
    update: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}`),
    compare: (projectId: string, leftScenarioId: string, rightScenarioId: string) => {
      const q = new URLSearchParams({ leftScenarioId, rightScenarioId })
      return apiPath(`/projects/${projectId}/finance-scenarios/compare?${q}`)
    },
    recalculate: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/recalculate`),
    approve: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/approve`),
    markCurrent: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/mark-current`),
    archive: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/archive`),
    duplicate: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/duplicate`),
    summary: (projectId: string, scenarioId: string) =>
      apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/summary`),
    phases: {
      list: (projectId: string, scenarioId: string) =>
        apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/phases`),
      get: (projectId: string, scenarioId: string, phaseFinanceId: string) =>
        apiPath(
          `/projects/${projectId}/finance-scenarios/${scenarioId}/phases/${phaseFinanceId}`),
      updateRevenue: (projectId: string, scenarioId: string, phaseFinanceId: string) =>
        apiPath(
          `/projects/${projectId}/finance-scenarios/${scenarioId}/phases/${phaseFinanceId}/revenue`),
    },
    customCosts: {
      list: (projectId: string, scenarioId: string) =>
        apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/custom-costs`),
      create: (projectId: string, scenarioId: string) =>
        apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/custom-costs`),
      update: (projectId: string, scenarioId: string, costId: string) =>
        apiPath(
          `/projects/${projectId}/finance-scenarios/${scenarioId}/custom-costs/${costId}`),
      archive: (projectId: string, scenarioId: string, costId: string) =>
        apiPath(
          `/projects/${projectId}/finance-scenarios/${scenarioId}/custom-costs/${costId}/archive`),
    },
    vendorCosts: {
      list: (projectId: string, scenarioId: string) =>
        apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/vendor-costs`),
      create: (projectId: string, scenarioId: string) =>
        apiPath(`/projects/${projectId}/finance-scenarios/${scenarioId}/vendor-costs`),
      update: (projectId: string, scenarioId: string, costId: string) =>
        apiPath(
          `/projects/${projectId}/finance-scenarios/${scenarioId}/vendor-costs/${costId}`),
      archive: (projectId: string, scenarioId: string, costId: string) =>
        apiPath(
          `/projects/${projectId}/finance-scenarios/${scenarioId}/vendor-costs/${costId}/archive`),
    },
  },
  current: {
    get: (projectId: string) => apiPath(`/projects/${projectId}/finance/current`),
    summary: (projectId: string) =>
      apiPath(`/projects/${projectId}/finance/current/summary`),
    phases: (projectId: string) =>
      apiPath(`/projects/${projectId}/finance/current/phases`),
  },
} as const
