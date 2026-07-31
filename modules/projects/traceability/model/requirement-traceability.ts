/** Full-chain Requirement Traceability (Coverage / Matrix / Gaps) — matches BE Phase 1–2. */

export const TraceCoverageStatus = {
  Complete: 'COMPLETE',
  Partial: 'PARTIAL',
} as const
export type TraceCoverageStatus = (typeof TraceCoverageStatus)[keyof typeof TraceCoverageStatus]

export const TraceGapCode = {
  MissingFunction: 'MISSING_FUNCTION',
  MissingUseCase: 'MISSING_USE_CASE',
  IncompleteUseCase: 'INCOMPLETE_USE_CASE',
  MissingImplementation: 'MISSING_IMPLEMENTATION',
  MissingTest: 'MISSING_TEST',
  MissingNfrSpecification: 'MISSING_NFR_SPECIFICATION',
  MissingVerificationTarget: 'MISSING_VERIFICATION_TARGET',
  MissingVerificationCase: 'MISSING_VERIFICATION_CASE',
  VerificationFailed: 'VERIFICATION_FAILED',
  TestFailed: 'TEST_FAILED',
  Blocked: 'BLOCKED',
} as const
export type TraceGapCode = (typeof TraceGapCode)[keyof typeof TraceGapCode]

export const RequiresUseCase = {
  Yes: 'YES',
  No: 'NO',
  Auto: 'AUTO',
} as const
export type RequiresUseCase = (typeof RequiresUseCase)[keyof typeof RequiresUseCase]

export const FunnelStage = {
  Requirements: 'REQUIREMENTS',
  HasFunction: 'HAS_FUNCTION',
  HasUseCase: 'HAS_USE_CASE',
  HasImplementation: 'HAS_IMPLEMENTATION',
  HasTest: 'HAS_TEST',
} as const
export type FunnelStage = (typeof FunnelStage)[keyof typeof FunnelStage]

export interface TracePreviewObject {
  id: string
  objectType: string
  code?: string | null
  name: string
  relationKind?: string | null
  completenessStatus?: string | null
  latestResult?: string | null
}

export interface CoverageSummaryKpis {
  requirements: number
  completeCount: number
  completeCoveragePct: number
  partialCount: number
  missingFunctions: number
  missingUseCases: number
  missingImplementation: number
  missingTests: number
  failedTests: number
  blocked: number
}

export interface LayerCoverage {
  functionPct: number
  useCasePct: number
  implementationPct: number
  testPct: number
}

export interface FunnelStageCount {
  stage: string
  count: number
}

export interface CoverageByRequirementType {
  requirementType: string
  total: number
  completeCount: number
  completePct: number
  gapCounts: Record<string, number>
}

export interface CoverageSummaryResponse extends CoverageSummaryKpis {
  layerCoverage: LayerCoverage
  funnel: FunnelStageCount[]
  byRequirementType: CoverageByRequirementType[]
  generatedAt: string
  stale: boolean
}

export interface MatrixPreviewMore {
  functions: number
  useCases: number
  implementation: number
  testCases: number
}

export interface MatrixPreviews {
  functions: TracePreviewObject[]
  useCases: TracePreviewObject[]
  implementation: TracePreviewObject[]
  testCases: TracePreviewObject[]
}

export interface TraceabilityMatrixRow {
  requirementId: string
  code: string
  title: string
  requirementType: string
  priority?: string | null
  requiresUseCase: RequiresUseCase | string
  requiresUseCaseResolved: boolean
  coverageStatus: TraceCoverageStatus | string
  gapCodes: string[]
  functionCount: number
  useCaseCount: number
  implementationCount: number
  testCaseCount: number
  latestResult?: string | null
  latestResultAt?: string | null
  openDefectCount: number
  /** Optional NFR aggregate fields. Older BE matrix responses do not expose these yet. */
  nfrSpecificationConfigured?: boolean
  verificationTargetCount?: number
  verificationCaseCount?: number
  verificationResultCount?: number
  latestVerificationResult?: string | null
  previews: MatrixPreviews
  previewMore: MatrixPreviewMore
}

export interface TraceabilityMatrixResponse {
  summary: CoverageSummaryKpis
  items: TraceabilityMatrixRow[]
  page: { limit: number; offset: number; total: number }
  generatedAt: string
  stale: boolean
}

export interface TraceabilityMatrixQuery {
  q?: string
  coverageStatus?: string
  gapCode?: string
  requirementType?: string
  showGapsOnly?: boolean
  limit?: number
  offset?: number
}

export interface CoverageScore {
  pct: number
  layers: {
    function: boolean
    useCase: boolean
    implementation: boolean
    test: boolean
    passing: boolean
  }
}

export interface TraceGapItem {
  gapCode: string
  priority: string
  message: string
  recommendedAction: string
  relatedObject?: TracePreviewObject | null
}

export interface RequirementTraceDetailResponse {
  requirement: {
    id: string
    code: string
    title: string
    requirementType: string
    priority?: string | null
    requiresUseCase: RequiresUseCase | string
    requiresUseCaseResolved: boolean
  }
  coverageStatus: string
  gapCodes: string[]
  coverageScore: CoverageScore
  functions: TracePreviewObject[]
  useCases: TracePreviewObject[]
  implementationObjects: TracePreviewObject[]
  testCases: TracePreviewObject[]
  gaps: TraceGapItem[]
  generatedAt: string
}

export interface GapsSummary {
  total: number
  byGapCode: Record<string, number>
}

export interface GapsListItem {
  id: string
  gapCode: string
  priority: string
  requirement: { id: string; code: string; title: string }
  relatedObject?: TracePreviewObject | null
  recommendedAction: string
  message: string
}

export interface GapsResponse {
  summary: GapsSummary
  items: GapsListItem[]
  page: { limit: number; offset: number; total: number }
  generatedAt: string
  stale: boolean
}

export interface GapsQuery {
  gapCode?: string
  priority?: string
  requirementId?: string
  q?: string
  limit?: number
  offset?: number
}

export interface LinkableFunction {
  id: string
  code: string
  title: string
  type?: string | null
  status?: string | null
}

export interface LinkableUseCase {
  id: string
  key: string
  name: string
  status?: string | null
  completenessStatus?: string | null
}

export interface RequirementTraceHistoryItem {
  id: string
  action: string
  actorId?: string | null
  actorName?: string | null
  message: string
  occurredAt: string
}

export interface RequirementTraceHistoryResponse {
  items: RequirementTraceHistoryItem[]
  page: { limit: number; offset: number; total: number }
  generatedAt: string
}

export const GAP_CODE_LABEL: Record<string, string> = {
  MISSING_FUNCTION: 'Missing Function',
  MISSING_USE_CASE: 'Missing Use Case',
  INCOMPLETE_USE_CASE: 'Incomplete Use Case',
  MISSING_IMPLEMENTATION: 'Missing Implementation',
  MISSING_TEST: 'Missing Test',
  MISSING_NFR_SPECIFICATION: 'Missing NFR Specification',
  MISSING_VERIFICATION_TARGET: 'Missing Verification Target',
  MISSING_VERIFICATION_CASE: 'Missing Verification Case',
  VERIFICATION_FAILED: 'Failed Verification',
  TEST_FAILED: 'Failed Test',
  BLOCKED: 'Blocked',
}

/** Short chip labels for matrix Gaps column */
export const GAP_CODE_SHORT: Record<string, string> = {
  MISSING_FUNCTION: 'Function',
  MISSING_USE_CASE: 'Use Case',
  INCOMPLETE_USE_CASE: 'UC incomplete',
  MISSING_IMPLEMENTATION: 'Implementation',
  MISSING_TEST: 'Test',
  MISSING_NFR_SPECIFICATION: 'NFR spec',
  MISSING_VERIFICATION_TARGET: 'Target',
  MISSING_VERIFICATION_CASE: 'Verification case',
  VERIFICATION_FAILED: 'Verification failed',
  TEST_FAILED: 'Failed',
  BLOCKED: 'Blocked',
}

export const FUNNEL_STAGE_LABEL: Record<string, string> = {
  REQUIREMENTS: 'Requirements',
  HAS_FUNCTION: 'Has Function',
  HAS_USE_CASE: 'Has Use Case',
  HAS_IMPLEMENTATION: 'Has Implementation',
  HAS_TEST: 'Has Test',
}

/** Display coverage — FE derives NOT_COVERED when no layer has evidence. */
export const DisplayCoverageStatus = {
  NotCovered: 'NOT_COVERED',
  Partial: 'PARTIAL',
  Complete: 'COMPLETE',
  NotApplicable: 'NOT_APPLICABLE',
} as const
export type DisplayCoverageStatus =
  (typeof DisplayCoverageStatus)[keyof typeof DisplayCoverageStatus]

export type GapSeverity = 'critical' | 'warning' | 'blocked' | 'info'

export interface EvaluatedGap {
  gapCode: string
  severity: GapSeverity
  /** True = user can act now; false = blocked by upstream gap */
  actionable: boolean
  label: string
  shortLabel: string
}

export interface LayerStepState {
  key:
    | 'function'
    | 'useCase'
    | 'implementation'
    | 'test'
    | 'nfrSpecification'
    | 'verificationTarget'
    | 'verificationCase'
    | 'verificationResult'
  short: string
  label: string
  /** ok | missing | blocked | na */
  state: 'ok' | 'missing' | 'blocked' | 'na'
}

export function gapCodeLabel(code: string): string {
  return GAP_CODE_LABEL[code] ?? code
}

export function gapCodeShort(code: string): string {
  return GAP_CODE_SHORT[code] ?? code
}

export function gapCodeTone(code: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (code === 'TEST_FAILED' || code === 'VERIFICATION_FAILED' || code === 'BLOCKED') {
    return 'error'
  }
  if (code === 'MISSING_FUNCTION') return 'error'
  if (code === 'MISSING_TEST' || code === 'MISSING_IMPLEMENTATION') return 'warning'
  if (code.startsWith('MISSING_') || code === 'INCOMPLETE_USE_CASE') return 'warning'
  return 'default'
}

export function gapSeverityTone(
  severity: GapSeverity
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (severity === 'critical') return 'error'
  if (severity === 'warning') return 'warning'
  if (severity === 'blocked') return 'default'
  return 'info'
}

export function coverageStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (status === DisplayCoverageStatus.Complete || status === TraceCoverageStatus.Complete) {
    return 'success'
  }
  if (status === DisplayCoverageStatus.Partial || status === TraceCoverageStatus.Partial) {
    return 'warning'
  }
  if (status === DisplayCoverageStatus.NotCovered) return 'error'
  if (status === DisplayCoverageStatus.NotApplicable) return 'default'
  return 'default'
}

export function coverageStatusLabel(status: string): string {
  if (status === DisplayCoverageStatus.NotCovered) return 'Not covered'
  if (status === DisplayCoverageStatus.Complete || status === TraceCoverageStatus.Complete) {
    return 'Complete'
  }
  if (status === DisplayCoverageStatus.Partial || status === TraceCoverageStatus.Partial) {
    return 'Partial'
  }
  if (status === DisplayCoverageStatus.NotApplicable) return 'Not applicable'
  return status
}

/** All layer counts are zero → Not covered (not Partial). */
export function resolveDisplayCoverageStatus(row: {
  coverageStatus: string
  functionCount: number
  useCaseCount: number
  implementationCount: number
  testCaseCount: number
}): DisplayCoverageStatus | string {
  const empty =
    row.functionCount === 0 &&
    row.useCaseCount === 0 &&
    row.implementationCount === 0 &&
    row.testCaseCount === 0
  if (empty) {
    if (row.coverageStatus === DisplayCoverageStatus.NotApplicable) {
      return DisplayCoverageStatus.NotApplicable
    }
    return DisplayCoverageStatus.NotCovered
  }
  if (row.coverageStatus === TraceCoverageStatus.Complete) {
    return DisplayCoverageStatus.Complete
  }
  if (row.coverageStatus === DisplayCoverageStatus.NotApplicable) {
    return DisplayCoverageStatus.NotApplicable
  }
  return DisplayCoverageStatus.Partial
}

/**
 * Re-evaluate BE gapCodes with pipeline dependency:
 * Function → Use Case → Implementation → Test.
 * Without Function, UC/Impl are blocked (not equal severity).
 */
export function evaluateGaps(input: {
  gapCodes: string[]
  functionCount: number
  requiresUseCaseResolved: boolean
}): EvaluatedGap[] {
  const codes = [...input.gapCodes]
  const hasFunction = input.functionCount > 0
  const missingFn =
    codes.includes(TraceGapCode.MissingFunction) || (!hasFunction && codes.length > 0)

  const out: EvaluatedGap[] = []
  const seen = new Set<string>()

  const push = (gapCode: string, severity: GapSeverity, actionable: boolean) => {
    if (seen.has(gapCode)) return
    seen.add(gapCode)
    out.push({
      gapCode,
      severity,
      actionable,
      label: gapCodeLabel(gapCode),
      shortLabel: gapCodeShort(gapCode),
    })
  }

  if (codes.length === 0 && !hasFunction) {
    push(TraceGapCode.MissingFunction, 'critical', true)
    return out
  }

  if (missingFn) {
    push(TraceGapCode.MissingFunction, 'critical', true)
  }

  for (const code of codes) {
    if (code === TraceGapCode.MissingFunction) continue

    if (code === TraceGapCode.MissingUseCase || code === TraceGapCode.IncompleteUseCase) {
      if (!input.requiresUseCaseResolved) continue
      push(
        code,
        missingFn ? 'blocked' : code === TraceGapCode.IncompleteUseCase ? 'warning' : 'critical',
        !missingFn
      )
      continue
    }

    if (code === TraceGapCode.MissingImplementation) {
      push(code, missingFn ? 'blocked' : 'warning', !missingFn)
      continue
    }

    if (code === TraceGapCode.MissingTest) {
      push(code, 'warning', true)
      continue
    }

    if (
      code === TraceGapCode.MissingNfrSpecification ||
      code === TraceGapCode.MissingVerificationTarget ||
      code === TraceGapCode.MissingVerificationCase
    ) {
      push(code, code === TraceGapCode.MissingNfrSpecification ? 'critical' : 'warning', true)
      continue
    }

    if (
      code === TraceGapCode.TestFailed ||
      code === TraceGapCode.VerificationFailed ||
      code === TraceGapCode.Blocked
    ) {
      push(code, 'critical', true)
      continue
    }

    push(code, 'warning', true)
  }

  if (missingFn && input.requiresUseCaseResolved && !seen.has(TraceGapCode.MissingUseCase)) {
    push(TraceGapCode.MissingUseCase, 'blocked', false)
  }
  if (missingFn && !seen.has(TraceGapCode.MissingImplementation)) {
    push(TraceGapCode.MissingImplementation, 'blocked', false)
  }

  return out
}

export function primaryActionableGap(gaps: EvaluatedGap[]): EvaluatedGap | null {
  return gaps.find((g) => g.actionable) ?? gaps[0] ?? null
}

export function recommendedActionLabel(gapCode: string): string {
  switch (gapCode) {
    case TraceGapCode.MissingFunction:
      return 'Link Function'
    case TraceGapCode.MissingUseCase:
      return 'Create Use Case'
    case TraceGapCode.IncompleteUseCase:
      return 'Complete Use Case'
    case TraceGapCode.MissingImplementation:
      return 'Link Implementation'
    case TraceGapCode.MissingTest:
      return 'Create Test Case'
    case TraceGapCode.MissingNfrSpecification:
      return 'Define NFR'
    case TraceGapCode.MissingVerificationTarget:
      return 'Add Target'
    case TraceGapCode.MissingVerificationCase:
      return 'Add Verification Case'
    case TraceGapCode.VerificationFailed:
      return 'Review Verification'
    case TraceGapCode.TestFailed:
      return 'Open Test Result'
    case TraceGapCode.Blocked:
      return 'Resolve Blocked Test'
    default:
      return 'Review'
  }
}

export function buildLayerSteps(input: {
  functionCount: number
  useCaseCount: number
  implementationCount: number
  testCaseCount: number
  requiresUseCaseResolved: boolean
}): LayerStepState[] {
  const hasFn = input.functionCount > 0
  const hasUc = input.useCaseCount > 0
  const hasImpl = input.implementationCount > 0
  const hasTc = input.testCaseCount > 0

  return [
    {
      key: 'function',
      short: 'F',
      label: 'Function',
      state: hasFn ? 'ok' : 'missing',
    },
    {
      key: 'useCase',
      short: 'UC',
      label: 'Use Case',
      state: !input.requiresUseCaseResolved ? 'na' : !hasFn ? 'blocked' : hasUc ? 'ok' : 'missing',
    },
    {
      key: 'implementation',
      short: 'I',
      label: 'Implementation',
      state: !hasFn ? 'blocked' : hasImpl ? 'ok' : 'missing',
    },
    {
      key: 'test',
      short: 'T',
      label: 'Test',
      state: hasTc ? 'ok' : 'missing',
    },
  ]
}

export function isNfrRequirement(requirementType: string | null | undefined): boolean {
  const normalized = (requirementType ?? '').trim().toUpperCase().replace(/-/g, '_')
  return normalized === 'NON_FUNCTIONAL' || normalized === 'NFR'
}

/**
 * NFR pipeline aggregate fields are optional until the BE matrix contract exposes them.
 * `undefined` is rendered as N/A/unknown; it must not be treated as missing evidence.
 */
export function buildNfrLayerSteps(input: {
  specificationConfigured?: boolean
  verificationTargetCount?: number
  verificationCaseCount?: number
  verificationResultCount?: number
}): LayerStepState[] {
  const stateOf = (value: boolean | undefined): LayerStepState['state'] =>
    value === undefined ? 'na' : value ? 'ok' : 'missing'

  return [
    {
      key: 'nfrSpecification',
      short: 'S',
      label: 'Specification',
      state: stateOf(input.specificationConfigured),
    },
    {
      key: 'verificationTarget',
      short: 'VT',
      label: 'Target',
      state: stateOf(
        input.verificationTargetCount === undefined ? undefined : input.verificationTargetCount > 0
      ),
    },
    {
      key: 'verificationCase',
      short: 'VC',
      label: 'Verification Case',
      state: stateOf(
        input.verificationCaseCount === undefined ? undefined : input.verificationCaseCount > 0
      ),
    },
    {
      key: 'verificationResult',
      short: 'R',
      label: 'Result',
      state: stateOf(
        input.verificationResultCount === undefined ? undefined : input.verificationResultCount > 0
      ),
    },
  ]
}

export function formatImplementationSummary(
  items: TracePreviewObject[],
  totalCount: number
): string {
  if (totalCount === 0) return '—'
  const counts: Record<string, number> = {}
  for (const item of items) {
    const t = item.objectType || 'OBJECT'
    counts[t] = (counts[t] ?? 0) + 1
  }
  const labelMap: Record<string, string> = {
    SCREEN: 'Screens',
    API_ENDPOINT: 'APIs',
    DATA_ENTITY: 'Entities',
    COMPONENT: 'Components',
    TASK: 'Tasks',
  }
  const parts = Object.entries(counts).map(([type, n]) => {
    const label = labelMap[type] ?? type
    return `${n} ${n === 1 ? label.replace(/s$/, '') : label}`
  })
  const known = Object.values(counts).reduce((a, b) => a + b, 0)
  if (parts.length === 0) return `${totalCount} objects`
  if (totalCount > known) {
    parts.push(`+${totalCount - known}`)
  }
  return parts.join(' · ')
}

export function formatRelationCell(
  items: TracePreviewObject[],
  more: number,
  emptyLabel = '—'
): { primary: string; more: number; empty: boolean } {
  if (items.length === 0) {
    return { primary: emptyLabel, more: 0, empty: true }
  }
  const first = items[0]
  const name = [first.code, first.name].filter(Boolean).join(' · ') || first.name
  return { primary: name, more: more + Math.max(0, items.length - 1), empty: false }
}

export function formatTestsCell(row: {
  testCaseCount: number
  latestResult?: string | null
  previews: { testCases: TracePreviewObject[] }
  previewMore: { testCases: number }
}): string {
  if (row.testCaseCount === 0) return '—'
  const result = row.latestResult ? ` · ${row.latestResult}` : ''
  return `${row.testCaseCount} test${row.testCaseCount === 1 ? '' : 's'}${result}`
}

/** Group gap list items by requirement for Gaps tab. */
export function groupGapsByRequirement(items: GapsListItem[]): Array<{
  requirement: GapsListItem['requirement']
  priority: string
  gaps: EvaluatedGap[]
  primary: EvaluatedGap | null
  actionLabel: string
}> {
  const map = new Map<
    string,
    {
      requirement: GapsListItem['requirement']
      priority: string
      gapCodes: string[]
    }
  >()
  for (const item of items) {
    const existing = map.get(item.requirement.id)
    if (existing) {
      if (!existing.gapCodes.includes(item.gapCode)) {
        existing.gapCodes.push(item.gapCode)
      }
    } else {
      map.set(item.requirement.id, {
        requirement: item.requirement,
        priority: item.priority,
        gapCodes: [item.gapCode],
      })
    }
  }
  return Array.from(map.values()).map((row) => {
    const gaps = evaluateGaps({
      gapCodes: row.gapCodes,
      functionCount: row.gapCodes.includes(TraceGapCode.MissingFunction) ? 0 : 1,
      requiresUseCaseResolved: true,
    })
    const primary = primaryActionableGap(gaps)
    return {
      requirement: row.requirement,
      priority: row.priority,
      gaps,
      primary,
      actionLabel: primary ? recommendedActionLabel(primary.gapCode) : 'Review',
    }
  })
}
