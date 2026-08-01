import { apiPath } from '@/shared/lib/api-paths'

export const QUALITY_ENDPOINTS = {
  plans: (projectId: string) => apiPath(`/projects/${projectId}/quality-plans`),
  plan: (projectId: string, id: string) => apiPath(`/projects/${projectId}/quality-plans/${id}`),
  approvePlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/quality-plans/${id}/approve`),
  markCurrentPlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/quality-plans/${id}/mark-current`),
  testPlans: (projectId: string) => apiPath(`/projects/${projectId}/test-plans`),
  testPlan: (projectId: string, id: string) => apiPath(`/projects/${projectId}/test-plans/${id}`),
  approveTestPlan: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-plans/${id}/approve`),
  testSuites: (projectId: string, testPlanId: string) =>
    apiPath(`/projects/${projectId}/test-plans/${testPlanId}/suites`),
  testCases: (projectId: string) => apiPath(`/projects/${projectId}/test-cases`),
  testCase: (projectId: string, id: string) => apiPath(`/projects/${projectId}/test-cases/${id}`),
  testCasesBatch: (projectId: string) => apiPath(`/projects/${projectId}/test-cases/batch`),
  testCasesBulk: (projectId: string) => apiPath(`/projects/${projectId}/test-cases/bulk`),
  testCaseSteps: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/steps`),
  testCaseStep: (projectId: string, testCaseId: string, stepId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/steps/${stepId}`),
  reorderTestCaseSteps: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/steps/reorder`),
  batchTestCaseSteps: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/steps/batch`),
  duplicateTestCaseStep: (projectId: string, testCaseId: string, stepId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/steps/${stepId}/duplicate`),
  archiveTestCaseStep: (projectId: string, testCaseId: string, stepId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/steps/${stepId}/archive`),
  testCaseTraceability: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/traceability`),
  testCaseRequirementLinks: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/requirement-links`),
  testCaseUseCaseLinks: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/use-case-links`),
  approveTestCase: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-cases/${id}/approve`),
  testCaseCoverage: (projectId: string, testCaseId: string) =>
    apiPath(`/projects/${projectId}/test-cases/${testCaseId}/coverage`),
  testRuns: (projectId: string) => apiPath(`/projects/${projectId}/test-runs`),
  testRun: (projectId: string, id: string) => apiPath(`/projects/${projectId}/test-runs/${id}`),
  testRunResults: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/results`),
  testRunResult: (projectId: string, testRunId: string, resultId: string) =>
    apiPath(`/projects/${projectId}/test-runs/${testRunId}/results/${resultId}`),
  testRunResultsBatch: (projectId: string, testRunId: string) =>
    apiPath(`/projects/${projectId}/test-runs/${testRunId}/results/batch`),
  startTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/start`),
  completeTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/complete`),
  cancelTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/cancel`),
  verificationResults: (projectId: string, testRunId: string) =>
    apiPath(`/projects/${projectId}/test-runs/${testRunId}/verification-results`),
  verificationResult: (projectId: string, testRunId: string, resultId: string) =>
    apiPath(`/projects/${projectId}/test-runs/${testRunId}/verification-results/${resultId}`),
  verificationCases: (projectId: string) =>
    apiPath(`/projects/${projectId}/verification-cases`),
  verificationCase: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/verification-cases/${id}`),
  archiveVerificationCase: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/verification-cases/${id}/archive`),
  nfrSpecification: (projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/nfr-specification`),
  nfrTargets: (projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/nfr-targets`),
  defects: (projectId: string) => apiPath(`/projects/${projectId}/defects`),
  defect: (projectId: string, id: string) => apiPath(`/projects/${projectId}/defects/${id}`),
  triageDefect: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/triage`),
  markDefectFixed: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/mark-fixed`),
  readyDefectForRetest: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/ready-for-retest`),
  verifyDefect: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/verify`),
  closeDefect: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/close`),
  reopenDefect: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/reopen`),
  defectStatusAction: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/defects/${id}/status-actions`),
  releases: (projectId: string) => apiPath(`/projects/${projectId}/releases`),
  release: (projectId: string, id: string) => apiPath(`/projects/${projectId}/releases/${id}`),
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
  rollbackPlans: (projectId: string) => apiPath(`/projects/${projectId}/rollback-plans`),
  approveRollbackPlan: (projectId: string, planId: string) =>
    apiPath(`/projects/${projectId}/rollback-plans/${planId}/approve`),
  qualityReport: (projectId: string, reportKey: string) =>
    apiPath(`/projects/${projectId}/reports/${reportKey}`),
  list: (projectId: string) => apiPath(`/projects/${projectId}/quality-plans`),
  get: (projectId: string, id: string) => apiPath(`/projects/${projectId}/quality-plans/${id}`),

  // —— Simplified Quality Workflow (additive; degrade when BE missing) ——
  qualityOverview: (projectId: string) => apiPath(`/projects/${projectId}/quality/overview`),
  qualitySettings: (projectId: string) => apiPath(`/projects/${projectId}/quality-settings`),
  verificationCasesBatch: (projectId: string) =>
    apiPath(`/projects/${projectId}/verification-cases/batch`),
  planTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/plan`),
  reopenTestRun: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/reopen`),
  testRunCompletionValidation: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/completion-validation`),
  testRunMembership: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/membership`),
  copyTestRunMembership: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/test-runs/${id}/membership/copy`),
  releaseReadiness: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/releases/${id}/readiness`),
  recalculateReleaseReadiness: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/releases/${id}/recalculate-readiness`),
  overrideReleaseReadiness: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/releases/${id}/override-readiness`),
} as const
