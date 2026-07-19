import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { QUALITY_ENDPOINTS } from './endpoints'
import type { Defect, QualityPlan, ReleasePackage } from '../../domain/model/quality'

export interface ListResponse<T> {
  items: T[]
  page?: { limit: number; offset: number; total: number }
}

export async function listQualityPlans(scopeId: string): Promise<ListResponse<QualityPlan>> {
  const res = await apiClient.get<ListPayload<QualityPlan>>(QUALITY_ENDPOINTS.list(scopeId))
  return normalizeItemList(res)
}

export async function getQualityPlan(scopeId: string, id: string): Promise<QualityPlan> {
  return apiClient.get(QUALITY_ENDPOINTS.get(scopeId, id))
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

export async function listDefects(projectId: string): Promise<ListResponse<Defect>> {
  const res = await apiClient.get<ListPayload<Defect>>(QUALITY_ENDPOINTS.defects(projectId))
  return normalizeItemList(res)
}

export async function closeDefect(
  projectId: string,
  defectId: string,
  body?: { resolutionType?: string; resolutionNote?: string }
): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.closeDefect(projectId, defectId), {
    resolutionType: body?.resolutionType ?? 'FIXED',
    resolutionNote: body?.resolutionNote ?? null,
  })
}

export async function listReleases(projectId: string): Promise<ListResponse<ReleasePackage>> {
  const res = await apiClient.get<ListPayload<ReleasePackage>>(QUALITY_ENDPOINTS.releases(projectId))
  return normalizeItemList(res)
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

export interface TestPlanItem {
  id: string
  title: string
  status?: string
}

export interface TestRunItem {
  id: string
  title: string
  status?: string
}

export interface DeploymentItem {
  id: string
  title: string
  status?: string
}

export async function listTestPlans(projectId: string): Promise<ListResponse<TestPlanItem>> {
  const res = await apiClient.get<ListPayload<TestPlanItem>>(QUALITY_ENDPOINTS.testPlans(projectId))
  return normalizeItemList(res)
}

export async function approveTestPlan(
  projectId: string,
  testPlanId: string
): Promise<TestPlanItem> {
  return apiClient.post(QUALITY_ENDPOINTS.approveTestPlan(projectId, testPlanId), {})
}

export async function listTestRuns(projectId: string): Promise<ListResponse<TestRunItem>> {
  const res = await apiClient.get<ListPayload<TestRunItem>>(QUALITY_ENDPOINTS.testRuns(projectId))
  return normalizeItemList(res)
}

export async function startTestRun(projectId: string, testRunId: string): Promise<TestRunItem> {
  return apiClient.post(QUALITY_ENDPOINTS.startTestRun(projectId, testRunId), {})
}

export async function completeTestRun(
  projectId: string,
  testRunId: string
): Promise<TestRunItem> {
  return apiClient.post(QUALITY_ENDPOINTS.completeTestRun(projectId, testRunId), {})
}

export async function cancelTestRun(projectId: string, testRunId: string): Promise<TestRunItem> {
  return apiClient.post(QUALITY_ENDPOINTS.cancelTestRun(projectId, testRunId), {})
}

export async function listDeployments(
  projectId: string
): Promise<ListResponse<DeploymentItem>> {
  const res = await apiClient.get<ListPayload<DeploymentItem>>(QUALITY_ENDPOINTS.deployments(projectId))
  return normalizeItemList(res)
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
  const res = await apiClient.get<ListPayload<DeploymentEnvironment>>(QUALITY_ENDPOINTS.deploymentEnvironments(projectId))
  return normalizeItemList(res)
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
  const res = await apiClient.get<ListPayload<RollbackPlan>>(QUALITY_ENDPOINTS.rollbackPlans(projectId))
  return normalizeItemList(res)
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
