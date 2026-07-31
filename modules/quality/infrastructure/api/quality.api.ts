import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { QUALITY_ENDPOINTS } from './endpoints'
import type {
  BatchUpdateTestCasesChanges,
  CompleteRunPayload,
  CopyRunMembershipPayload,
  CreateDefectPayload,
  CreateQualityPlanPayload,
  CreateQualityRunPayload,
  CreateReleasePayload,
  CreateTestCasePayload,
  CreateTestCaseStepPayload,
  CreateTestPlanPayload,
  CreateTestRunPayload,
  CreateTestSuitePayload,
  CreateVerificationCasePayload,
  Defect,
  DefectDetail,
  DefectStatusActionPayload,
  DefectWorkItem,
  ManageNfrTargetsPayload,
  ManageRunMembershipPayload,
  NfrSpecification,
  NfrTargetListResponse,
  OverrideReleaseReadinessPayload,
  PatchQualitySettingsPayload,
  QualityOverviewResponse,
  QualityPlan,
  QualitySettings,
  RecordVerificationResultPayload,
  ReleasePackage,
  ReleaseReadinessDetail,
  RunCompletionValidation,
  RunMembershipResponse,
  SaveNfrSpecificationPayload,
  TestCase,
  TestCaseDetail,
  TestCaseListQuery,
  TestCaseStep,
  TestCaseTraceability,
  TestPlan,
  TestRun,
  TestRunResult,
  TestRunResultsQuery,
  TestSuite,
  UpdateQualityRunPayload,
  UpdateTestCasePayload,
  UpdateTestCaseStepPayload,
  UpdateTestRunResultPayload,
  UpdateVerificationCasePayload,
  UpdateVerificationResultPayload,
  VerificationCase,
  VerificationCaseListQuery,
  VerificationCaseResult,
} from '../../domain/model/quality'
import { ApiError } from '@/shared/lib/api-types'

export interface ListResponse<T> {
  items: T[]
  page?: { limit: number; offset: number; total: number }
}

interface PagePayload<T> {
  items?: T[]
  page?: number
  size?: number
  totalElements?: number
}

function asList<T>(res: ListPayload<T>): ListResponse<T> {
  return normalizeItemList(res)
}

function asPageList<T>(res: PagePayload<T>): ListResponse<T> {
  const limit = res.size ?? 20
  return {
    items: res.items ?? [],
    page: {
      limit,
      offset: (res.page ?? 0) * limit,
      total: res.totalElements ?? res.items?.length ?? 0,
    },
  }
}

function withQuery(url: string, query: object): string {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const suffix = params.toString()
  return suffix ? `${url}?${suffix}` : url
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

export async function listTestCases(
  projectId: string,
  query: TestCaseListQuery = {}
): Promise<ListResponse<TestCase>> {
  return asPageList(
    await apiClient.get<PagePayload<TestCase>>(
      withQuery(QUALITY_ENDPOINTS.testCases(projectId), query)
    )
  )
}

export async function createTestCase(
  projectId: string,
  body: CreateTestCasePayload
): Promise<TestCase> {
  return apiClient.post(QUALITY_ENDPOINTS.testCases(projectId), body)
}

export async function getTestCase(projectId: string, testCaseId: string): Promise<TestCaseDetail> {
  return apiClient.get(QUALITY_ENDPOINTS.testCase(projectId, testCaseId))
}

export async function updateTestCase(
  projectId: string,
  testCaseId: string,
  body: UpdateTestCasePayload
): Promise<TestCase> {
  return apiClient.patch(QUALITY_ENDPOINTS.testCase(projectId, testCaseId), body)
}

export async function batchUpdateTestCases(
  projectId: string,
  testCaseIds: string[],
  changes: BatchUpdateTestCasesChanges
): Promise<{ updated: string[]; failed: Array<{ id?: string; reason?: string }> }> {
  return apiClient.patch(QUALITY_ENDPOINTS.testCasesBatch(projectId), { testCaseIds, changes })
}

export async function bulkCreateTestCases(
  projectId: string,
  items: CreateTestCasePayload[]
): Promise<{ created?: TestCase[]; errors?: Array<{ rowIndex?: number; reason?: string }> }> {
  return apiClient.post(QUALITY_ENDPOINTS.testCasesBatch(projectId), { items })
}

export async function listTestCaseSteps(
  projectId: string,
  testCaseId: string
): Promise<ListResponse<TestCaseStep>> {
  return asList(
    await apiClient.get<ListPayload<TestCaseStep>>(
      QUALITY_ENDPOINTS.testCaseSteps(projectId, testCaseId)
    )
  )
}

export async function createTestCaseStep(
  projectId: string,
  testCaseId: string,
  body: CreateTestCaseStepPayload
): Promise<TestCaseStep> {
  return apiClient.post(QUALITY_ENDPOINTS.testCaseSteps(projectId, testCaseId), body)
}

export async function updateTestCaseStep(
  projectId: string,
  testCaseId: string,
  stepId: string,
  body: UpdateTestCaseStepPayload
): Promise<TestCaseStep> {
  return apiClient.patch(QUALITY_ENDPOINTS.testCaseStep(projectId, testCaseId, stepId), body)
}

export async function reorderTestCaseSteps(
  projectId: string,
  testCaseId: string,
  stepIds: string[]
): Promise<TestCaseStep[]> {
  return apiClient.patch(QUALITY_ENDPOINTS.reorderTestCaseSteps(projectId, testCaseId), {
    orderedStepIds: stepIds,
  })
}

export async function batchCreateTestCaseSteps(
  projectId: string,
  testCaseId: string,
  items: CreateTestCaseStepPayload[]
): Promise<{
  created?: TestCaseStep[]
  errors?: Array<{ rowIndex?: number; reason?: string }>
}> {
  return apiClient.post(QUALITY_ENDPOINTS.batchTestCaseSteps(projectId, testCaseId), { items })
}

export async function duplicateTestCaseStep(
  projectId: string,
  testCaseId: string,
  stepId: string
): Promise<TestCaseStep> {
  return apiClient.post(QUALITY_ENDPOINTS.duplicateTestCaseStep(projectId, testCaseId, stepId), {})
}

export async function archiveTestCaseStep(
  projectId: string,
  testCaseId: string,
  stepId: string
): Promise<TestCaseStep> {
  return apiClient.patch(QUALITY_ENDPOINTS.archiveTestCaseStep(projectId, testCaseId, stepId), {})
}

export async function getTestCaseTraceability(
  projectId: string,
  testCaseId: string
): Promise<TestCaseTraceability> {
  return apiClient.get(QUALITY_ENDPOINTS.testCaseTraceability(projectId, testCaseId))
}

export async function replaceTestCaseRequirementLinks(
  projectId: string,
  testCaseId: string,
  requirementIds: string[]
): Promise<TestCaseTraceability> {
  return apiClient.put(QUALITY_ENDPOINTS.testCaseRequirementLinks(projectId, testCaseId), {
    requirementIds,
  })
}

export async function replaceTestCaseUseCaseLinks(
  projectId: string,
  testCaseId: string,
  useCaseIds: string[]
): Promise<TestCaseTraceability> {
  return apiClient.put(QUALITY_ENDPOINTS.testCaseUseCaseLinks(projectId, testCaseId), {
    useCaseIds,
  })
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

export async function listTestRuns(
  projectId: string,
  query: { q?: string; status?: string; page?: number; size?: number } = {}
): Promise<ListResponse<TestRun>> {
  return asPageList(
    await apiClient.get<PagePayload<TestRun>>(
      withQuery(QUALITY_ENDPOINTS.testRuns(projectId), query)
    )
  )
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

export async function listTestRunResults(
  projectId: string,
  testRunId: string,
  query: TestRunResultsQuery = {}
): Promise<ListResponse<TestRunResult>> {
  return asPageList(
    await apiClient.get<PagePayload<TestRunResult>>(
      withQuery(QUALITY_ENDPOINTS.testRunResults(projectId, testRunId), query)
    )
  )
}

export async function updateTestRunResult(
  projectId: string,
  testRunId: string,
  resultId: string,
  body: UpdateTestRunResultPayload
): Promise<TestRunResult> {
  return apiClient.patch(QUALITY_ENDPOINTS.testRunResult(projectId, testRunId, resultId), body)
}

export async function batchUpdateTestRunResults(
  projectId: string,
  testRunId: string,
  resultIds: string[],
  changes: { result?: string; assigneeId?: string | null }
): Promise<{ updated: string[]; failed: Array<{ id?: string; reason?: string }> }> {
  return apiClient.patch(QUALITY_ENDPOINTS.testRunResultsBatch(projectId, testRunId), {
    resultIds,
    changes,
  })
}

export async function listVerificationResults(
  projectId: string,
  testRunId: string
): Promise<ListResponse<VerificationCaseResult>> {
  return asList(
    await apiClient.get<ListPayload<VerificationCaseResult>>(
      QUALITY_ENDPOINTS.verificationResults(projectId, testRunId)
    )
  )
}

export async function recordVerificationResult(
  projectId: string,
  testRunId: string,
  body: RecordVerificationResultPayload
): Promise<VerificationCaseResult> {
  return apiClient.post(QUALITY_ENDPOINTS.verificationResults(projectId, testRunId), body)
}

export async function getVerificationResult(
  projectId: string,
  testRunId: string,
  resultId: string
): Promise<VerificationCaseResult> {
  return apiClient.get(QUALITY_ENDPOINTS.verificationResult(projectId, testRunId, resultId))
}

export async function updateVerificationResult(
  projectId: string,
  testRunId: string,
  resultId: string,
  body: UpdateVerificationResultPayload
): Promise<VerificationCaseResult> {
  return apiClient.patch(
    QUALITY_ENDPOINTS.verificationResult(projectId, testRunId, resultId),
    body
  )
}

// —— Verification Cases ——

export async function listVerificationCases(
  projectId: string,
  query: VerificationCaseListQuery = {}
): Promise<ListResponse<VerificationCase>> {
  return asPageList(
    await apiClient.get<PagePayload<VerificationCase>>(
      withQuery(QUALITY_ENDPOINTS.verificationCases(projectId), query)
    )
  )
}

export async function createVerificationCase(
  projectId: string,
  body: CreateVerificationCasePayload
): Promise<VerificationCase> {
  return apiClient.post(QUALITY_ENDPOINTS.verificationCases(projectId), body)
}

export async function getVerificationCase(
  projectId: string,
  verificationCaseId: string
): Promise<VerificationCase> {
  return apiClient.get(QUALITY_ENDPOINTS.verificationCase(projectId, verificationCaseId))
}

export async function updateVerificationCase(
  projectId: string,
  verificationCaseId: string,
  body: UpdateVerificationCasePayload
): Promise<VerificationCase> {
  return apiClient.patch(
    QUALITY_ENDPOINTS.verificationCase(projectId, verificationCaseId),
    body
  )
}

export async function archiveVerificationCase(
  projectId: string,
  verificationCaseId: string
): Promise<VerificationCase> {
  return apiClient.post(
    QUALITY_ENDPOINTS.archiveVerificationCase(projectId, verificationCaseId),
    {}
  )
}

// —— NFR Specification / Targets ——

export async function getNfrSpecification(
  projectId: string,
  requirementId: string
): Promise<NfrSpecification> {
  return apiClient.get(QUALITY_ENDPOINTS.nfrSpecification(projectId, requirementId))
}

export async function saveNfrSpecification(
  projectId: string,
  requirementId: string,
  body: SaveNfrSpecificationPayload
): Promise<NfrSpecification> {
  return apiClient.put(QUALITY_ENDPOINTS.nfrSpecification(projectId, requirementId), body)
}

export async function getNfrTargets(
  projectId: string,
  requirementId: string
): Promise<NfrTargetListResponse> {
  return apiClient.get(QUALITY_ENDPOINTS.nfrTargets(projectId, requirementId))
}

export async function replaceNfrTargets(
  projectId: string,
  requirementId: string,
  body: ManageNfrTargetsPayload
): Promise<NfrTargetListResponse> {
  return apiClient.put(QUALITY_ENDPOINTS.nfrTargets(projectId, requirementId), body)
}

// —— Defects ——

export async function listDefects(projectId: string): Promise<ListResponse<Defect>> {
  return asList(await apiClient.get<ListPayload<Defect>>(QUALITY_ENDPOINTS.defects(projectId)))
}

export async function getDefect(projectId: string, defectId: string): Promise<Defect> {
  return apiClient.get(QUALITY_ENDPOINTS.defect(projectId, defectId))
}

export async function createDefect(projectId: string, body: CreateDefectPayload): Promise<Defect> {
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

export async function triageDefect(projectId: string, defectId: string): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.triageDefect(projectId, defectId), {})
}

export async function markDefectFixed(projectId: string, defectId: string): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.markDefectFixed(projectId, defectId), {})
}

export async function readyDefectForRetest(projectId: string, defectId: string): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.readyDefectForRetest(projectId, defectId), {})
}

export async function verifyDefect(projectId: string, defectId: string): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.verifyDefect(projectId, defectId), {})
}

export async function reopenDefect(
  projectId: string,
  defectId: string,
  body?: { reason?: string }
): Promise<Defect> {
  return apiClient.post(QUALITY_ENDPOINTS.reopenDefect(projectId, defectId), {
    reason: body?.reason ?? 'Reopened from Defect Center',
  })
}

/** Map simplified UI actions onto WAVE4 defect lifecycle endpoints. */
export async function applyDefectLifecycleAction(
  projectId: string,
  defectId: string,
  action: 'start' | 'resolve' | 'retest' | 'close' | 'reject' | 'reopen'
): Promise<Defect> {
  switch (action) {
    case 'start':
      return triageDefect(projectId, defectId)
    case 'resolve':
      return markDefectFixed(projectId, defectId)
    case 'retest':
      return readyDefectForRetest(projectId, defectId)
    case 'close':
      return closeDefect(projectId, defectId)
    case 'reject':
      return closeDefect(projectId, defectId, {
        resolutionType: 'REJECTED',
        resolutionNote: 'Rejected from Defect Center',
      })
    case 'reopen':
      return reopenDefect(projectId, defectId)
    default:
      throw new Error(`Unknown defect action: ${action}`)
  }
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

export async function markReleased(projectId: string, releaseId: string): Promise<ReleasePackage> {
  return apiClient.post(QUALITY_ENDPOINTS.markReleased(projectId, releaseId), {})
}

// —— Deployments (lifecycle only) ——

export interface DeploymentItem {
  id: string
  title?: string
  name?: string
  status?: string
}

export async function listDeployments(projectId: string): Promise<ListResponse<DeploymentItem>> {
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

export async function listRollbackPlans(projectId: string): Promise<ListResponse<RollbackPlan>> {
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

// —— Simplified Quality Workflow (additive contracts) ——

function isMissingContract(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.status === 501)
}

export async function getQualityOverview(
  projectId: string
): Promise<QualityOverviewResponse | null> {
  try {
    return await apiClient.get<QualityOverviewResponse>(
      QUALITY_ENDPOINTS.qualityOverview(projectId),
      { skipErrorToast: true }
    )
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function getQualitySettings(projectId: string): Promise<QualitySettings | null> {
  try {
    return await apiClient.get<QualitySettings>(QUALITY_ENDPOINTS.qualitySettings(projectId), {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function patchQualitySettings(
  projectId: string,
  body: PatchQualitySettingsPayload
): Promise<QualitySettings | null> {
  try {
    return await apiClient.patch<QualitySettings>(
      QUALITY_ENDPOINTS.qualitySettings(projectId),
      body
    )
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function createQualityRun(
  projectId: string,
  body: CreateQualityRunPayload
): Promise<TestRun> {
  return apiClient.post(QUALITY_ENDPOINTS.testRuns(projectId), body)
}

export async function updateQualityRun(
  projectId: string,
  runId: string,
  body: UpdateQualityRunPayload
): Promise<TestRun> {
  return apiClient.patch(QUALITY_ENDPOINTS.testRun(projectId, runId), body)
}

export async function planTestRun(projectId: string, runId: string): Promise<TestRun | null> {
  try {
    return await apiClient.post(QUALITY_ENDPOINTS.planTestRun(projectId, runId), {}, {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function reopenTestRun(projectId: string, runId: string): Promise<TestRun | null> {
  try {
    return await apiClient.post(QUALITY_ENDPOINTS.reopenTestRun(projectId, runId), {}, {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function getRunCompletionValidation(
  projectId: string,
  runId: string
): Promise<RunCompletionValidation | null> {
  try {
    return await apiClient.get(QUALITY_ENDPOINTS.testRunCompletionValidation(projectId, runId), {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function completeTestRunWithOptions(
  projectId: string,
  runId: string,
  body: CompleteRunPayload = {}
): Promise<TestRun> {
  return apiClient.post(QUALITY_ENDPOINTS.completeTestRun(projectId, runId), body)
}

export async function getRunMembership(
  projectId: string,
  runId: string
): Promise<RunMembershipResponse | null> {
  try {
    return await apiClient.get(QUALITY_ENDPOINTS.testRunMembership(projectId, runId), {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function manageRunMembership(
  projectId: string,
  runId: string,
  body: ManageRunMembershipPayload
): Promise<RunMembershipResponse | null> {
  try {
    return await apiClient.put(QUALITY_ENDPOINTS.testRunMembership(projectId, runId), body, {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function copyRunMembership(
  projectId: string,
  runId: string,
  body: CopyRunMembershipPayload
): Promise<RunMembershipResponse | null> {
  try {
    return await apiClient.post(QUALITY_ENDPOINTS.copyTestRunMembership(projectId, runId), body, {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function listDefectWorkItems(
  projectId: string,
  query: Record<string, string | number | boolean | undefined> = {}
): Promise<ListResponse<DefectWorkItem>> {
  return asList(
    await apiClient.get<ListPayload<DefectWorkItem>>(
      withQuery(QUALITY_ENDPOINTS.defects(projectId), query)
    )
  )
}

export async function getDefectDetail(
  projectId: string,
  defectId: string
): Promise<DefectDetail | null> {
  try {
    return await apiClient.get(QUALITY_ENDPOINTS.defect(projectId, defectId), {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function applyDefectStatusAction(
  projectId: string,
  defectId: string,
  body: DefectStatusActionPayload
): Promise<Defect | null> {
  try {
    return await apiClient.post(QUALITY_ENDPOINTS.defectStatusAction(projectId, defectId), body, {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function getReleaseReadiness(
  projectId: string,
  releaseId: string
): Promise<ReleaseReadinessDetail | null> {
  try {
    return await apiClient.get(QUALITY_ENDPOINTS.releaseReadiness(projectId, releaseId), {
      skipErrorToast: true,
    })
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function recalculateReleaseReadiness(
  projectId: string,
  releaseId: string
): Promise<ReleaseReadinessDetail | null> {
  try {
    return await apiClient.post(
      QUALITY_ENDPOINTS.recalculateReleaseReadiness(projectId, releaseId),
      {},
      { skipErrorToast: true }
    )
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function overrideReleaseReadiness(
  projectId: string,
  releaseId: string,
  body: OverrideReleaseReadinessPayload
): Promise<ReleaseReadinessDetail | null> {
  try {
    return await apiClient.post(
      QUALITY_ENDPOINTS.overrideReleaseReadiness(projectId, releaseId),
      body,
      { skipErrorToast: true }
    )
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}

export async function batchCreateVerificationCases(
  projectId: string,
  items: CreateVerificationCasePayload[]
): Promise<VerificationCase[] | null> {
  try {
    const res = await apiClient.post<{ items?: VerificationCase[] }>(
      QUALITY_ENDPOINTS.verificationCasesBatch(projectId),
      { items },
      { skipErrorToast: true }
    )
    return res.items ?? null
  } catch (err) {
    if (isMissingContract(err)) return null
    throw err
  }
}
