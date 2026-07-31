import type {
  CaseRow,
  QualityOverviewResponse,
  QualityPlan,
  QualitySettings,
  ReleasePackage,
  ReleaseReadinessDetail,
  RunExecutionRow,
  TestCase,
  TestRun,
  TestRunResult,
  VerificationCase,
  VerificationCaseResult,
} from '../../domain/model/quality'
import { normalizeCaseLifecycleStatus } from '../../domain/rules/quality.rules'

function asLatestResult(value: TestCase['latestResult'], at?: string | null) {
  if (value == null) return null
  if (typeof value === 'string') {
    return { result: value, executedAt: at ?? null }
  }
  return { result: String(value), executedAt: at ?? null }
}

export function mapTestCaseToCaseRow(tc: TestCase): CaseRow {
  return {
    kind: 'FUNCTIONAL',
    id: tc.id,
    code: tc.code ?? '—',
    title: tc.title,
    status: normalizeCaseLifecycleStatus(tc.status),
    priority: tc.priority ?? 'MEDIUM',
    ownerUserId: tc.ownerUserId ?? tc.assigneeId ?? null,
    tags: tc.tags ?? [],
    latestResult: asLatestResult(tc.latestResult, tc.latestResultAt),
    updatedAt: tc.updatedAt,
    useCaseId: tc.useCaseId ?? null,
    useCaseCode: tc.useCaseCode ?? null,
    useCaseTitle: tc.useCaseTitle ?? null,
    functionId: tc.functionId ?? null,
    functionCode: tc.functionCode ?? null,
    requirementIds: tc.requirementIds ?? [],
    automationStatus: tc.automationStatus ?? null,
  }
}

export function mapVerificationCaseToCaseRow(vc: VerificationCase): CaseRow {
  return {
    kind: 'NFR',
    id: vc.id,
    code: vc.code ?? '—',
    title: vc.title,
    status: vc.lifecycleStatus,
    priority: vc.priority ?? 'MEDIUM',
    ownerUserId: vc.ownerUserId ?? vc.ownerId ?? vc.assigneeId ?? null,
    tags: vc.tags ?? [],
    latestResult: vc.latestResult
      ? {
          result: vc.latestResult.resultStatus ?? vc.latestResult.result ?? 'NOT_RUN',
          executedAt: vc.latestResult.executedAt ?? null,
          actualValue: vc.latestResult.actualValue ?? null,
          actualUnit: vc.latestResult.actualValueUnit ?? null,
          thresholdMet: vc.latestResult.thresholdMet ?? null,
        }
      : null,
    updatedAt: vc.updatedAt,
    requirementId: vc.requirementId ?? null,
    requirementCode: vc.requirementCode ?? null,
    requirementTitle: vc.requirementTitle ?? null,
    qualityAttribute: vc.qualityAttribute ?? null,
    verificationMethod: vc.verificationMethod ?? null,
    comparisonOperator: vc.comparisonOperator ?? null,
    thresholdValue: vc.thresholdValue ?? null,
    thresholdUnit: vc.thresholdUnit ?? null,
    environment: vc.environment ?? null,
  }
}

export function mapTestRunResultToExecutionRow(result: TestRunResult): RunExecutionRow {
  const code = result.testCase?.code?.trim() || null
  const title = result.testCase?.title?.trim() || null
  return {
    kind: 'FUNCTIONAL',
    resultId: result.id,
    caseId: result.testCaseId,
    caseCode: code ?? '—',
    // Prefer real title; never invent "Unavailable…" — membership fallback / case fetch fills gaps.
    caseTitle: title || code || 'Untitled case',
    status: result.resultStatus ?? 'NOT_RUN',
    notes: result.comment ?? null,
    defectId: result.defectId ?? null,
  }
}

export function mapVerificationResultToExecutionRow(
  result: VerificationCaseResult,
  meta?: { caseCode?: string; caseTitle?: string; qualityAttribute?: string | null }
): RunExecutionRow {
  const code = meta?.caseCode?.trim() || null
  const title = meta?.caseTitle?.trim() || null
  return {
    kind: 'NFR',
    resultId: result.id,
    caseId: result.verificationCaseId,
    caseCode: code ?? '—',
    caseTitle: title || code || 'Untitled case',
    status: result.resultStatus,
    qualityAttribute: meta?.qualityAttribute ?? null,
    actualValue: result.actualValue ?? null,
    actualUnit: result.actualValueUnit ?? null,
    notes: result.comment ?? null,
    defectId: result.defectId ?? null,
  }
}

/** Map legacy Quality Plan fields into project Quality Settings until settings API ships. */
export function mapQualityPlanToSettings(plan: QualityPlan, projectId: string): QualitySettings {
  return {
    projectId,
    coverageRules: {
      requireUseCaseForFunctionalCases: true,
      requireNfrForVerificationCases: true,
      minFunctionalCoveragePercent: null,
    },
    nfrRules: {
      requireThresholdForReady: true,
      requireEnvironmentForReady: false,
    },
    defectThresholds: {
      maxOpenBlockers: 0,
      maxOpenCritical: 0,
      maxOpenMajor: null,
    },
    releaseGates: {
      requireAllCriticalCasesPassed: true,
      requireNoOpenBlockers: true,
      requireNoOpenCriticalDefects: true,
      minPassRatePercent: null,
      requiredRunScopes: [],
    },
    sourceQualityPlanId: plan.id,
    updatedAt: plan.updatedAt ?? plan.createdAt ?? null,
  }
}

export function mapReleaseToReadinessDetail(release: ReleasePackage): ReleaseReadinessDetail {
  const status = release.readinessStatus ?? release.status ?? 'DRAFT'
  const readinessStatus =
    status === 'READY_FOR_RELEASE' || status === 'READY'
      ? 'READY'
      : status === 'RELEASED'
        ? 'RELEASED'
        : status === 'CANCELLED'
          ? 'CANCELLED'
          : status === 'IN_TESTING' || status === 'AT_RISK'
            ? 'AT_RISK'
            : status === 'ROLLED_BACK' || status === 'BLOCKED'
              ? 'BLOCKED'
              : 'DRAFT'

  return {
    releaseId: release.id,
    readinessStatus,
    gates: [],
    coverageSummary: null,
    requiredRuns: [],
    openDefects: [],
    decisionHistory: [],
    canMarkReady: readinessStatus === 'AT_RISK' || readinessStatus === 'DRAFT',
    canOverride: false,
  }
}

/** Compatibility overview when dedicated overview API is unavailable. */
export function buildCompatOverview(input: {
  projectId: string
  functionalCaseCount: number
  nfrCaseCount: number
  recentRuns: TestRun[]
  currentRelease?: ReleasePackage | null
  openCriticalDefects: number
}): QualityOverviewResponse {
  const latestRun = input.recentRuns[0]
  const passRate =
    latestRun && latestRun.total && latestRun.total > 0
      ? Math.round(((latestRun.passed ?? 0) / latestRun.total) * 100)
      : 0

  return {
    projectId: input.projectId,
    metrics: [
      {
        key: 'functional_cases',
        label: 'Functional cases',
        value: input.functionalCaseCount,
        targetRoute: 'cases',
        filterParams: { type: 'functional' },
      },
      {
        key: 'nfr_cases',
        label: 'NFR verifications',
        value: input.nfrCaseCount,
        targetRoute: 'cases',
        filterParams: { type: 'nfr' },
      },
      {
        key: 'pass_rate',
        label: 'Latest run pass rate',
        value: passRate,
        unit: '%',
        targetRoute: 'runs',
      },
      {
        key: 'critical_defects',
        label: 'Critical defects',
        value: input.openCriticalDefects,
        targetRoute: 'defects',
        filterParams: { severity: 'CRITICAL' },
      },
    ],
    needsAttention: [],
    recentRuns: input.recentRuns.slice(0, 5).map((run) => ({
      id: run.id,
      name: run.name || run.title || run.id,
      status: run.status,
      progressPercent:
        run.total && run.total > 0
          ? Math.round(((run.executed ?? run.passed ?? 0) / run.total) * 100)
          : 0,
      updatedAt: run.completedAt ?? run.startedAt ?? run.createdAt ?? null,
    })),
    currentRelease: input.currentRelease
      ? {
          id: input.currentRelease.id,
          name: input.currentRelease.name,
          version: input.currentRelease.versionLabel ?? null,
          readinessStatus: input.currentRelease.readinessStatus ?? input.currentRelease.status,
          gateSummary: null,
        }
      : null,
    generatedAt: new Date().toISOString(),
  }
}
