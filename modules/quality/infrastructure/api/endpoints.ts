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
  testPlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-plans/${id}`),
  approveTestPlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-plans/${id}/approve`),
  testSuites: (projectId: string, testPlanId: string) =>
    apiPath(`/projects/${projectId}/test-plans/${testPlanId}/suites`),
  testCases: (projectId: string) => apiPath(`/projects/${projectId}/test-cases`),
  testCase: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-cases/${id}`),
  approveTestCase: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-cases/${id}/approve`),
  testCaseCoverage: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/coverage`),
  testRuns: (projectId: string) => apiPath(`/projects/${projectId}/test-runs`),
  testRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}`),
  startTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/start`),
  completeTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/complete`),
  cancelTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/cancel`),
  defects: (projectId: string) => apiPath(`/projects/${projectId}/defects`),
  defect: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}`),
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
