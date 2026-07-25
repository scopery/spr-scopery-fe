import type {
  DefectCategory,
  DefectPriority,
  DefectSeverity,
  ReleaseType,
  TestCasePriority,
  TestCaseType,
  TestLevel,
  TestRunType,
} from '../enums/quality.enum'

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

export interface TestCase {
  id: string
  projectId: string
  code?: string | null
  title: string
  type?: string
  priority?: string
  status: string
  testSuiteId?: string | null
  createdAt?: string
}

export interface CreateTestCasePayload {
  title: string
  type: TestCaseType | string
  priority: TestCasePriority | string
  code?: string | null
  description?: string | null
  testSuiteId?: string | null
  preconditions?: string | null
  expectedResult?: string | null
}

export interface TestRun {
  id: string
  projectId: string
  name: string
  title?: string
  runType?: string
  status: string
  startedAt?: string | null
  completedAt?: string | null
  createdAt?: string
}

export interface CreateTestRunPayload {
  name: string
  runType: TestRunType | string
  testPlanId?: string | null
  testSuiteId?: string | null
  releasePackageId?: string | null
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

export function displayName(entity: {
  name?: string | null
  title?: string | null
  code?: string | null
  id: string
}): string {
  return entity.name || entity.title || entity.code || entity.id
}
