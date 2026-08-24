import type {
  AutomationStatus,
  ComparisonOperator,
  DefectCategory,
  DefectPriority,
  DefectSeverity,
  NfrTargetType,
  QualityAttribute,
  ReleaseType,
  RunScope,
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  TestExecutionResult,
  TestLevel,
  TestRunType,
  VerificationCaseStatus,
  VerificationMethod,
} from '../enums/quality.enum'

export type {
  RunScope,
  VerificationCaseStatus,
  VerificationMethod,
  QualityAttribute,
  ComparisonOperator,
  NfrTargetType,
}

export interface QualityPlan {
  id: string
  projectId: string
  code?: string | null
  name: string
  /** @deprecated BE uses name — kept for older UI callers */
  title?: string
  status: string
  currentFlag?: boolean
  createdAt?: string
  updatedAt?: string
  qualityObjectives?: string | null
  testStrategy?: string | null
  entryCriteria?: string | null
  exitCriteria?: string | null
}

export interface CreateQualityPlanPayload {
  name: string
  code?: string | null
  description?: string | null
  qualityObjectives?: string | null
  testStrategy?: string | null
  entryCriteria?: string | null
  exitCriteria?: string | null
}

export interface TestPlan {
  id: string
  projectId: string
  code?: string | null
  name: string
  title?: string
  testLevel?: string
  status: string
  createdAt?: string
}

export interface CreateTestPlanPayload {
  name: string
  testLevel: TestLevel | string
  code?: string | null
  description?: string | null
  qualityPlanId?: string | null
  releasePackageId?: string | null
}

export interface TestSuite {
  id: string
  projectId: string
  testPlanId: string
  name: string
  status: string
  sortOrder?: number | null
  createdAt?: string
}

export interface CreateTestSuitePayload {
  name: string
  description?: string | null
  deliverableId?: string | null
  scopeItemId?: string | null
  sortOrder?: number | null
}

export interface AssigneeRef {
  id: string
  displayName: string
}

export interface TestCaseSummary {
  id: string
  code: string
  title: string
}

export interface TestCase {
  id: string
  projectId: string
  code?: string | null
  title: string
  type?: string
  priority?: string
  status: string
  testSuiteId?: string | null
  useCaseId?: string | null
  /** Enriched catalog fields (optional until BE ships) */
  useCaseCode?: string | null
  useCaseTitle?: string | null
  functionId?: string | null
  functionCode?: string | null
  requirementIds?: string[]
  ownerUserId?: string | null
  tags?: string[]
  description?: string | null
  preconditions?: string | null
  expectedResult?: string | null
  assigneeId?: string | null
  assignee?: AssigneeRef | null
  automationStatus?: AutomationStatus | string
  stepCount?: number
  requirementCount?: number
  useCaseCount?: number
  latestResult?: TestExecutionResult | string | null
  latestResultAt?: string | null
  openDefectCount?: number
  createdAt?: string
  updatedAt?: string
  version?: number
}

export interface CreateTestCasePayload {
  title: string
  type?: TestCaseType | string
  priority?: TestCasePriority | string
  code?: string | null
  description?: string | null
  testSuiteId?: string | null
  useCaseId?: string | null
  preconditions?: string | null
  expectedResult?: string | null
  assigneeId?: string | null
  automationStatus?: AutomationStatus | string
  /** Optional — BE applies after shell create on POST …/bulk. */
  steps?: CreateTestCaseStepPayload[]
}

export interface UpdateTestCasePayload {
  title?: string
  code?: string | null
  type?: TestCaseType | string
  priority?: TestCasePriority | string
  status?: TestCaseStatus | string
  description?: string | null
  preconditions?: string | null
  expectedResult?: string | null
  useCaseId?: string | null
  assigneeId?: string | null
  automationStatus?: AutomationStatus | string
  version: number
}

export interface BatchUpdateTestCasesChanges {
  priority?: TestCasePriority | string
  status?: TestCaseStatus | string
  assigneeId?: string | null
  automationStatus?: AutomationStatus | string
}

export interface TestCaseListQuery {
  q?: string
  type?: string
  priority?: string
  status?: string
  assigneeId?: string
  automationStatus?: string
  requirementId?: string
  useCaseId?: string
  latestResult?: string
  hasOpenDefect?: boolean
  sort?: string
  page?: number
  size?: number
}

export interface TestCaseStep {
  id: string
  testCaseId?: string
  projectId?: string
  sortOrder: number
  action: string
  expectedResult?: string | null
  screenId?: string | null
  componentId?: string | null
  archivedAt?: string | null
  createdAt?: string
  updatedAt?: string
  version?: number
}

export interface CreateTestCaseStepPayload {
  action: string
  expectedResult?: string | null
  screenId?: string | null
  componentId?: string | null
}

export interface UpdateTestCaseStepPayload extends Partial<CreateTestCaseStepPayload> {
  version?: number
}

export interface TestCaseTraceLink {
  id: string
  objectType?: string | null
  code?: string | null
  name?: string | null
  derived?: boolean
}

export interface TestCaseTraceability {
  requirements: TestCaseTraceLink[]
  useCases: TestCaseTraceLink[]
  derivedFunctions: TestCaseTraceLink[]
  derivedScreens: TestCaseTraceLink[]
  derivedApis: TestCaseTraceLink[]
  derivedComponents: TestCaseTraceLink[]
}

export interface TestCaseDetail extends TestCase {
  steps: TestCaseStep[]
  traceability?: TestCaseTraceability
}

export interface TestRun {
  id: string
  projectId: string
  name: string
  title?: string
  runType?: string
  runScope?: RunScope | string
  status: string
  startedAt?: string | null
  completedAt?: string | null
  createdAt?: string
  total?: number
  executed?: number
  passed?: number
  failed?: number
  blocked?: number
  skipped?: number
  releasePackageName?: string | null
  deploymentEnvironmentName?: string | null
}

export interface CreateTestRunPayload {
  name: string
  runType: TestRunType | string
  runScope?: RunScope | string
  testPlanId?: string | null
  testSuiteId?: string | null
  releasePackageId?: string | null
}

export interface VerificationCaseResult {
  id: string
  projectId: string
  testRunId: string
  verificationCaseId: string
  resultStatus: TestExecutionResult | string
  actualValue?: number | null
  actualValueUnit?: string | null
  actualResultJson?: string | null
  evidenceReference?: string | null
  executedAt?: string | null
  executedById?: string | null
  defectId?: string | null
  comment?: string | null
  version: number
  createdAt?: string
  updatedAt?: string
}

export interface RecordVerificationResultPayload {
  verificationCaseId: string
  resultStatus?: TestExecutionResult | string
  actualValue?: number | null
  actualValueUnit?: string | null
  actualResultJson?: string | null
  evidenceReference?: string | null
  executedById?: string | null
  defectId?: string | null
  comment?: string | null
}

export interface UpdateVerificationResultPayload {
  resultStatus?: TestExecutionResult | string
  actualValue?: number | null
  actualValueUnit?: string | null
  actualResultJson?: string | null
  evidenceReference?: string | null
  executedById?: string | null
  defectId?: string | null
  comment?: string | null
  version: number
}

export interface TestRunResult {
  id: string
  testRunId: string
  /** Optional — list endpoint often only nests id under `testCase` */
  testCaseId?: string
  testCase?: TestCaseSummary
  assigneeId?: string | null
  resultStatus: TestExecutionResult | string
  defectId?: string | null
  comment?: string | null
  executedAt?: string | null
  createdAt?: string
  version?: number
}

export interface TestRunResultsQuery {
  q?: string
  result?: string
  assigneeId?: string
  hasDefect?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface UpdateTestRunResultPayload {
  result: TestExecutionResult | string
  comment?: string | null
  version?: number
}

export interface DefectSource {
  kind: 'FUNCTIONAL_RESULT' | 'VERIFICATION_RESULT' | string
  testRunId?: string | null
  testRunName?: string | null
  resultId?: string | null
  resultStatus?: string | null
  caseKind?: 'FUNCTIONAL' | 'NFR' | string | null
  caseId?: string | null
  caseCode?: string | null
  caseTitle?: string | null
  resultComment?: string | null
  /** Present on some NFR enrichments */
  qualityAttribute?: string | null
}

export interface Defect {
  id: string
  projectId: string
  code?: string | null
  title: string
  category?: string
  severity?: string
  priority?: string
  status: string
  assignedToUserId?: string | null
  createdAt?: string
  description?: string | null
  reproductionSteps?: string | null
  expectedResult?: string | null
  actualResult?: string | null
  /** Enriched on list/detail when defect was created from a run result */
  source?: DefectSource | null
}

export interface CreateDefectPayload {
  title: string
  category: DefectCategory | string
  severity: DefectSeverity | string
  priority: DefectPriority | string
  code?: string | null
  description?: string | null
  reproductionSteps?: string | null
  expectedResult?: string | null
  actualResult?: string | null
  sourceTestCaseResultId?: string | null
  sourceVerificationResultId?: string | null
}

export interface ReleasePackage {
  id: string
  projectId: string
  code: string
  versionLabel?: string
  name: string
  title?: string
  releaseType?: string
  status: string
  readinessStatus?: string
  createdAt?: string
}

export interface CreateReleasePayload {
  code: string
  versionLabel: string
  name: string
  releaseType: ReleaseType | string
  description?: string | null
  plannedReleaseDate?: string | null
}

export interface Deployment {
  id: string
  projectId: string
  title: string
  status: string
}

export interface VerificationCase {
  id: string
  projectId: string
  requirementId: string
  code?: string | null
  title: string
  description?: string | null
  verificationMethod: VerificationMethod | string
  procedure?: string | null
  expectedResultJson?: string | null
  environment?: string | null
  lifecycleStatus: VerificationCaseStatus | string
  automationStatus?: AutomationStatus | string
  ownerId?: string | null
  assigneeId?: string | null
  assignee?: AssigneeRef | null
  archivedAt?: string | null
  createdAt?: string
  updatedAt?: string
  version?: number
  /** Enriched catalog fields (optional until BE ships) */
  requirementCode?: string | null
  requirementTitle?: string | null
  qualityAttribute?: string | null
  comparisonOperator?: string | null
  thresholdValue?: number | null
  thresholdUnit?: string | null
  priority?: string
  ownerUserId?: string | null
  tags?: string[]
  latestResult?: {
    resultStatus?: string
    result?: string
    executedAt?: string | null
    actualValue?: number | null
    actualValueUnit?: string | null
    thresholdMet?: boolean | null
  } | null
}

export interface CreateVerificationCasePayload {
  requirementId: string
  title: string
  verificationMethod: VerificationMethod | string
  code?: string | null
  description?: string | null
  procedure?: string | null
  expectedResultJson?: string | null
  environment?: string | null
  automationStatus?: AutomationStatus | string
  ownerId?: string | null
  assigneeId?: string | null
}

export interface UpdateVerificationCasePayload {
  title?: string
  description?: string | null
  verificationMethod?: VerificationMethod | string
  procedure?: string | null
  expectedResultJson?: string | null
  environment?: string | null
  lifecycleStatus?: VerificationCaseStatus | string
  automationStatus?: AutomationStatus | string
  ownerId?: string | null
  assigneeId?: string | null
  version: number
}

export interface VerificationCaseListQuery {
  requirementId?: string
  status?: VerificationCaseStatus | string
  assigneeId?: string
  sort?: string
  page?: number
  size?: number
}

export interface NfrSpecification {
  requirementId: string
  qualityAttribute: QualityAttribute | string
  metricName?: string | null
  comparisonOperator?: ComparisonOperator | string | null
  targetValue?: number | null
  secondaryTargetValue?: number | null
  unit?: string | null
  measurementWindow?: string | null
  environment?: string | null
  verificationFrequency?: string | null
  configurationJson?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface SaveNfrSpecificationPayload {
  qualityAttribute: QualityAttribute | string
  metricName?: string | null
  comparisonOperator?: ComparisonOperator | string | null
  targetValue?: number | null
  secondaryTargetValue?: number | null
  unit?: string | null
  measurementWindow?: string | null
  environment?: string | null
  verificationFrequency?: string | null
  configurationJson?: string | null
}

export interface NfrTarget {
  id: string
  requirementId: string
  targetType: NfrTargetType | string
  targetId?: string | null
  targetLabel?: string | null
  displayOrder: number
  createdAt?: string
}

export interface NfrTargetListResponse {
  requirementId: string
  targets: NfrTarget[]
}

export interface ManageNfrTargetsPayload {
  targets: Array<{
    targetType: NfrTargetType | string
    targetId?: string | null
    targetLabel?: string | null
    displayOrder: number
  }>
}

export function displayName(entity: {
  name?: string | null
  title?: string | null
  code?: string | null
  id: string
}): string {
  return entity.name || entity.title || entity.code || '—'
}

// ─── Simplified Quality Workflow (additive DTOs) ─────────────────────────────

export type CaseKind = 'FUNCTIONAL' | 'NFR'

export interface CaseRowLatestResult {
  result: string
  executedAt?: string | null
  actualValue?: number | null
  actualUnit?: string | null
  thresholdMet?: boolean | null
}

/** Discriminated UI row for Cases grid — not a BE entity merge. */
export interface CaseRow {
  kind: CaseKind
  id: string
  code: string
  title: string
  status: string
  priority: string
  ownerUserId?: string | null
  tags: string[]
  latestResult?: CaseRowLatestResult | null
  updatedAt?: string
  // Functional
  useCaseId?: string | null
  useCaseCode?: string | null
  useCaseTitle?: string | null
  functionId?: string | null
  functionCode?: string | null
  requirementIds?: string[]
  automationStatus?: string | null
  // NFR
  requirementId?: string | null
  requirementCode?: string | null
  requirementTitle?: string | null
  qualityAttribute?: string | null
  verificationMethod?: string | null
  comparisonOperator?: string | null
  thresholdValue?: number | null
  thresholdUnit?: string | null
  environment?: string | null
}

export type QualityAttentionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface QualityAttentionAction {
  id: string
  severity: QualityAttentionSeverity
  title: string
  description?: string | null
  targetRoute: string
  filterParams?: Record<string, string>
}

export interface QualityOverviewMetric {
  key: string
  label: string
  value: number
  unit?: string | null
  targetRoute: string
  filterParams?: Record<string, string>
}

export interface QualityOverviewRunSummary {
  id: string
  name: string
  status: string
  progressPercent: number
  updatedAt?: string | null
}

export interface QualityOverviewReleaseSummary {
  id: string
  name: string
  version?: string | null
  readinessStatus: string
  gateSummary?: string | null
}

export interface QualityOverviewResponse {
  projectId: string
  metrics: QualityOverviewMetric[]
  needsAttention: QualityAttentionAction[]
  recentRuns: QualityOverviewRunSummary[]
  currentRelease?: QualityOverviewReleaseSummary | null
  generatedAt: string
}

export interface QualityCoverageRules {
  requireUseCaseForFunctionalCases: boolean
  requireNfrForVerificationCases: boolean
  minFunctionalCoveragePercent?: number | null
}

export interface QualityNfrRules {
  requireThresholdForReady: boolean
  requireEnvironmentForReady: boolean
}

export interface QualityDefectThresholds {
  maxOpenBlockers: number
  maxOpenCritical: number
  maxOpenMajor?: number | null
}

export interface QualityReleaseGateConfig {
  requireAllCriticalCasesPassed: boolean
  requireNoOpenBlockers: boolean
  requireNoOpenCriticalDefects: boolean
  minPassRatePercent?: number | null
  requiredRunScopes?: string[]
}

export interface QualitySettings {
  projectId: string
  coverageRules: QualityCoverageRules
  nfrRules: QualityNfrRules
  defectThresholds: QualityDefectThresholds
  releaseGates: QualityReleaseGateConfig
  /** Compatibility: mapped from legacy Quality Plan when settings API unavailable */
  sourceQualityPlanId?: string | null
  updatedAt?: string | null
}

export interface PatchQualitySettingsPayload {
  coverageRules?: Partial<QualityCoverageRules>
  nfrRules?: Partial<QualityNfrRules>
  defectThresholds?: Partial<QualityDefectThresholds>
  releaseGates?: Partial<QualityReleaseGateConfig>
}

export interface RunMembershipItem {
  caseKind: CaseKind
  caseId: string
  caseCode?: string | null
  caseTitle?: string | null
  sourceGroupName?: string | null
  displayOrder?: number
}

export interface RunMembershipResponse {
  runId: string
  items: RunMembershipItem[]
}

export interface ManageRunMembershipPayload {
  add?: Array<{ caseKind: CaseKind; caseId: string }>
  remove?: Array<{ caseKind: CaseKind; caseId: string }>
}

export interface CopyRunMembershipPayload {
  sourceRunId: string
  replaceExisting?: boolean
}

export interface CreateQualityRunPayload {
  name: string
  description?: string | null
  runType: string
  runScope: string
  environment?: string | null
  buildVersion?: string | null
  ownerUserId?: string | null
  releaseId?: string | null
  plannedStartAt?: string | null
  plannedEndAt?: string | null
  caseIds?: Array<{ caseKind: CaseKind; caseId: string }>
  /** @deprecated Prefer direct caseIds; kept for BE compat during migration */
  testPlanId?: string | null
}

export interface UpdateQualityRunPayload {
  name?: string
  description?: string | null
  environment?: string | null
  buildVersion?: string | null
  ownerUserId?: string | null
  releaseId?: string | null
  plannedStartAt?: string | null
  plannedEndAt?: string | null
  status?: string
}

export interface RunCompletionValidation {
  runId: string
  canComplete: boolean
  totalCount: number
  passedCount: number
  failedCount: number
  blockedCount: number
  skippedCount: number
  notRunCount: number
  violations: Array<{ code: string; message: string; severity: string }>
}

export interface CompleteRunPayload {
  force?: boolean
  reason?: string | null
}

export interface DefectWorkItem {
  id: string
  code: string
  title: string
  status: string
  severity: string
  priority: string
  category?: string | null
  assigneeUserId?: string | null
  releaseId?: string | null
  sourceRunId?: string | null
  sourceCaseId?: string | null
  sourceCaseKind?: CaseKind | null
  sourceResultId?: string | null
  environment?: string | null
  ageDays?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface DefectDetail extends DefectWorkItem {
  description?: string | null
  expectedResult?: string | null
  actualResult?: string | null
  evidenceUrls?: string[]
  resolutionNotes?: string | null
}

export interface DefectStatusActionPayload {
  action: string
  reason?: string | null
  assigneeUserId?: string | null
}

export interface ReleaseGateEvaluation {
  gateKey: string
  label: string
  passed: boolean
  detail?: string | null
}

export interface ReleaseDecisionHistoryItem {
  id: string
  action: string
  readinessStatus: string
  reason?: string | null
  actorUserId?: string | null
  approverUserId?: string | null
  createdAt: string
}

export interface ReleaseReadinessDetail {
  releaseId: string
  readinessStatus: string
  gates: ReleaseGateEvaluation[]
  coverageSummary?: string | null
  requiredRuns?: Array<{ runId: string; name: string; status: string }>
  openDefects?: Array<{ id: string; code: string; severity: string; status: string }>
  decisionHistory: ReleaseDecisionHistoryItem[]
  canMarkReady: boolean
  canOverride: boolean
}

export interface OverrideReleaseReadinessPayload {
  readinessStatus: string
  reason: string
  approverUserId: string
}

/** Discriminated execution row for Runs grid. */
export interface RunExecutionRow {
  kind: CaseKind
  resultId: string
  caseId: string
  caseCode: string
  caseTitle: string
  status: string
  qualityAttribute?: string | null
  actualValue?: number | null
  actualUnit?: string | null
  thresholdMet?: boolean | null
  notes?: string | null
  defectId?: string | null
}
