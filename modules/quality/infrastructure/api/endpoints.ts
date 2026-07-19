import { apiPath } from '@/shared/lib/api-paths'

export const QUALITY_ENDPOINTS = {
  plans: (projectId: string) => apiPath(`/projects/${projectId}/quality-plans`),
  plan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/quality-plans/${id}`),
  approvePlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/quality-plans/${id}/approve`),
  markCurrentPlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/quality-plans/${id}/mark-current`),
  testPlans: (projectId: string) => apiPath(`/projects/${projectId}/test-plans`),
  approveTestPlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-plans/${id}/approve`),
  testCases: (projectId: string) => apiPath(`/projects/${projectId}/test-cases`),
  testRuns: (projectId: string) => apiPath(`/projects/${projectId}/test-runs`),
  defects: (projectId: string) => apiPath(`/projects/${projectId}/defects`),
  defect: (projectId: string, id: string) => apiPath(`/projects/${projectId}/defects/${id}`),
  closeDefect: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/close`),
  releases: (projectId: string) => apiPath(`/projects/${projectId}/releases`),
  release: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/releases/${id}`),
  checkReleaseReadiness: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/releases/${id}/check-readiness`),
  markReleaseReady: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/releases/${id}/mark-ready`),
  markReleased: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/releases/${id}/mark-released`),
  deployments: (projectId: string) => apiPath(`/projects/${projectId}/deployments`),
  deployment: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/deployments/${id}`),
  startDeployment: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/deployments/${id}/start`),
  succeedDeployment: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/deployments/${id}/succeed`),
  failDeployment: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/deployments/${id}/fail`),
  rollbackDeployment: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/deployments/${id}/rollback`),
  startTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/start`),
  completeTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/complete`),
  cancelTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/cancel`),
  deploymentEnvironments: (projectId: string) =>
    apiPath(`/projects/${projectId}/deployment-environments`),
  archiveDeploymentEnvironment: (projectId: string, envId: string) =>
    apiPath(`/projects/${projectId}/deployment-environments/${envId}/archive`),
  rollbackPlans: (projectId: string) =>
    apiPath(`/projects/${projectId}/rollback-plans`),
  approveRollbackPlan: (projectId: string, planId: string) =>
    apiPath(`/projects/${projectId}/rollback-plans/${planId}/approve`),
  qualityReport: (projectId: string, reportKey: string) =>
    apiPath(`/projects/${projectId}/reports/${reportKey}`),
  list: (projectId: string) => apiPath(`/projects/${projectId}/quality-plans`),
  get: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/quality-plans/${id}`),
} as const
