import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { QUALITY_ENDPOINTS } from './endpoints'
import type {
  CreateDefectPayload,
  CreateQualityPlanPayload,
  CreateReleasePayload,
  CreateTestCasePayload,
  CreateTestPlanPayload,
  CreateTestRunPayload,
  CreateTestSuitePayload,
  Defect,
  QualityPlan,
  ReleasePackage,
  TestCase,
  TestPlan,
  TestRun,
  TestSuite,
} from '../../domain/model/quality'

export interface ListResponse<T> {
  items: T[]
  page?: { limit: number; offset: number; total: number }
}

function asList<T>(res: ListPayload<T>): ListResponse<T> {
  return normalizeItemList(res)
}

// —— Quality plans ——

export async function listQualityPlans(scopeId: string): Promise<ListResponse<QualityPlan>> {
  return asList(await apiClient.get<ListPayload<QualityPlan>>(QUALITY_ENDPOINTS.list(scopeId)))
}

export async function getQualityPlan(scopeId: string, id: string): Promise<QualityPlan> {
  return apiClient.get(QUALITY_ENDPOINTS.get(scopeId, id))
}

export async function createQualityPlan(
  projectId: string,
  body: CreateQualityPlanPayload
): Promise<QualityPlan> {
  return apiClient.post(QUALITY_ENDPOINTS.plans(projectId), body)
}

export async function approveQualityPlan(projectId: string, planId: string): Promise<QualityPlan> {
  return apiClient.post(QUALITY_ENDPOINTS.approvePlan(projectId, planId), {})
}

export async function markQualityPlanCurrent(
  projectId: string,
  planId: string
): Promise<QualityPlan> {
  return apiClient.post(QUALITY_ENDPOINTS.markCurrentPlan(projectId, planId), {})
}

// —— Test plans / suites / cases / runs ——

/** @deprecated Prefer TestPlan — alias for older callers */
export type TestPlanItem = TestPlan
/** @deprecated Prefer TestRun */
export type TestRunItem = TestRun

export async function listTestPlans(projectId: string): Promise<ListResponse<TestPlan>> {
  return asList(await apiClient.get<ListPayload<TestPlan>>(QUALITY_ENDPOINTS.testPlans(projectId)))
}

export async function createTestPlan(
  projectId: string,
  body: CreateTestPlanPayload
): Promise<TestPlan> {
  return apiClient.post(QUALITY_ENDPOINTS.testPlans(projectId), body)
}

export async function approveTestPlan(projectId: string, testPlanId: string): Promise<TestPlan> {
  return apiClient.post(QUALITY_ENDPOINTS.approveTestPlan(projectId, testPlanId), {})
}

export async function listTestSuites(
  projectId: string,
  testPlanId: string
): Promise<ListResponse<TestSuite>> {
  return asList(
    await apiClient.get<ListPayload<TestSuite>>(QUALITY_ENDPOINTS.testSuites(projectId, testPlanId))
  )
}

export async function createTestSuite(
  projectId: string,
  testPlanId: string,
  body: CreateTestSuitePayload
): Promise<TestSuite> {
  return apiClient.post(QUALITY_ENDPOINTS.testSuites(projectId, testPlanId), body)
}

export async function listTestCases(projectId: string): Promise<ListResponse<TestCase>> {
  return asList(await apiClient.get<ListPayload<TestCase>>(QUALITY_ENDPOINTS.testCases(projectId)))
}

export async function createTestCase(
  projectId: string,
  body: CreateTestCasePayload
): Promise<TestCase> {
  return apiClient.post(QUALITY_ENDPOINTS.testCases(projectId), body)
}

export async function approveTestCase(projectId: string, testCaseId: string): Promise<TestCase> {
  return apiClient.post(QUALITY_ENDPOINTS.approveTestCase(projectId, testCaseId), {})
}

export async function createTestCaseCoverage(
  projectId: string,
  testCaseId: string,
  body: { targetType: string; targetId: string; coverageType: string }
): Promise<unknown> {
  return apiClient.post(QUALITY_ENDPOINTS.testCaseCoverage(projectId, testCaseId), body)
}

export async function listTestRuns(projectId: string): Promise<ListResponse<TestRun>> {
  return asList(await apiClient.get<ListPayload<TestRun>>(QUALITY_ENDPOINTS.testRuns(projectId)))
}

export async function createTestRun(
  projectId: string,
  body: CreateTestRunPayload
): Promise<TestRun> {
  return apiClient.post(QUALITY_ENDPOINTS.testRuns(projectId), body)
}

export async function startTestRun(projectId: string, testRunId: string): Promise<TestRun> {
  return apiClient.post(QUALITY_ENDPOINTS.startTestRun(projectId, testRunId), {})
}

export async function completeTestRun(projectId: string, testRunId: string): Promise<TestRun> {
  return apiClient.post(QUALITY_ENDPOINTS.completeTestRun(projectId, testRunId), {})
}

export async function cancelTestRun(projectId: string, testRunId: string): Promise<TestRun> {
  return apiClient.post(QUALITY_ENDPOINTS.cancelTestRun(projectId, testRunId), {})
}

// —— Defects ——

export async function listDefects(projectId: string): Promise<ListResponse<Defect>> {
  return asList(await apiClient.get<ListPayload<Defect>>(QUALITY_ENDPOINTS.defects(projectId)))
}

export async function createDefect(
  projectId: string,
  body: CreateDefectPayload
): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.defects(projectId), body)
}

export async function closeDefect(
  projectId: string,
  defectId: string,
  body?: { resolutionType?: string; resolutionNote?: string }
): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.closeDefect(projectId, defectId), {
    resolutionType: body?.resolutionType ?? 'FIXED',
    resolutionNote: body?.resolutionNote ?? 'Closed from Defect Center',
  })
}

// —— Releases ——

export async function listReleases(projectId: string): Promise<ListResponse<ReleasePackage>> {
  return asList(
    await apiClient.get<ListPayload<ReleasePackage>>(QUALITY_ENDPOINTS.releases(projectId))
  )
}

export async function createRelease(
  projectId: string,
  body: CreateReleasePayload
): Promise<ReleasePackage> {
  return apiClient.post(QUALITY_ENDPOINTS.releases(projectId), body)
}

export async function checkReleaseReadiness(
  projectId: string,
  releaseId: string
): Promise<{ ready: boolean; blockers?: string[] }> {
  return apiClient.post(QUALITY_ENDPOINTS.checkReleaseReadiness(projectId, releaseId), {})
}

export async function markReleaseReady(
  projectId: string,
  releaseId: string
): Promise<ReleasePackage> {
  return apiClient.post(QUALITY_ENDPOINTS.markReleaseReady(projectId, releaseId), {})
}

export async function markReleased(
  projectId: string,
  releaseId: string
): Promise<ReleasePackage> {
  return apiClient.post(QUALITY_ENDPOINTS.markReleased(projectId, releaseId), {})
}

// —— Deployments (lifecycle only) ——

export interface DeploymentItem {
  id: string
  title?: string
  name?: string
  status?: string
}

export async function listDeployments(
  projectId: string
): Promise<ListResponse<DeploymentItem>> {
  return asList(
    await apiClient.get<ListPayload<DeploymentItem>>(QUALITY_ENDPOINTS.deployments(projectId))
  )
}

export async function startDeployment(
  projectId: string,
  deploymentId: string
): Promise<DeploymentItem> {
  return apiClient.post(QUALITY_ENDPOINTS.startDeployment(projectId, deploymentId), {})
}

export async function succeedDeployment(
  projectId: string,
  deploymentId: string
): Promise<DeploymentItem> {
  return apiClient.post(QUALITY_ENDPOINTS.succeedDeployment(projectId, deploymentId), {})
}

export async function failDeployment(
  projectId: string,
  deploymentId: string,
  failureReason?: string
): Promise<DeploymentItem> {
  return apiClient.post(QUALITY_ENDPOINTS.failDeployment(projectId, deploymentId), {
    failureReason: failureReason ?? 'Failed from Deployment Center',
  })
}

export async function rollbackDeployment(
  projectId: string,
  deploymentId: string,
  rollbackReason?: string
): Promise<DeploymentItem> {
  return apiClient.post(QUALITY_ENDPOINTS.rollbackDeployment(projectId, deploymentId), {
    rollbackReason: rollbackReason ?? 'Rollback from Deployment Center',
  })
}

export interface DeploymentEnvironment {
  id: string
  name: string
  status?: string
}

export interface RollbackPlan {
  id: string
  name?: string
  status?: string
}

export async function listDeploymentEnvironments(
  projectId: string
): Promise<ListResponse<DeploymentEnvironment>> {
  return asList(
    await apiClient.get<ListPayload<DeploymentEnvironment>>(
      QUALITY_ENDPOINTS.deploymentEnvironments(projectId)
    )
  )
}

export async function archiveDeploymentEnvironment(
  projectId: string,
  envId: string
): Promise<void> {
  await apiClient.patch(
    QUALITY_ENDPOINTS.archiveDeploymentEnvironment(projectId, envId),
    {},
    { parseJson: false }
  )
}

export async function listRollbackPlans(
  projectId: string
): Promise<ListResponse<RollbackPlan>> {
  return asList(
    await apiClient.get<ListPayload<RollbackPlan>>(QUALITY_ENDPOINTS.rollbackPlans(projectId))
  )
}

export async function approveRollbackPlan(
  projectId: string,
  planId: string
): Promise<RollbackPlan> {
  return apiClient.post(QUALITY_ENDPOINTS.approveRollbackPlan(projectId, planId), {})
}

export async function getQualityReport(
  projectId: string,
  reportKey: string
): Promise<Record<string, unknown>> {
  return apiClient.get(QUALITY_ENDPOINTS.qualityReport(projectId, reportKey))
}
