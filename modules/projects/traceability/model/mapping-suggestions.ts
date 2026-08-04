export const MappingRelationType = {
  RequirementToFunction: 'REQUIREMENT_TO_FUNCTION',
  FunctionToUseCase: 'FUNCTION_TO_USE_CASE',
  UseCaseToTestCase: 'USE_CASE_TO_TEST_CASE',
} as const
export type MappingRelationType =
  (typeof MappingRelationType)[keyof typeof MappingRelationType]

export const MappingScope = {
  Unmapped: 'UNMAPPED',
  IncompleteCoverage: 'INCOMPLETE_COVERAGE',
  Changed: 'CHANGED',
  Selected: 'SELECTED',
} as const
export type MappingScope = (typeof MappingScope)[keyof typeof MappingScope]

export const MappingRunStatus = {
  Pending: 'PENDING',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const
export type MappingRunStatus = (typeof MappingRunStatus)[keyof typeof MappingRunStatus]

export const SuggestionDecision = {
  Suggest: 'SUGGEST',
  Ambiguous: 'AMBIGUOUS',
  NoMatch: 'NO_MATCH',
} as const
export type SuggestionDecision =
  (typeof SuggestionDecision)[keyof typeof SuggestionDecision]

export const SuggestionReviewStatus = {
  Pending: 'PENDING',
  Accepted: 'ACCEPTED',
  Rejected: 'REJECTED',
  Expired: 'EXPIRED',
  Replaced: 'REPLACED',
} as const
export type SuggestionReviewStatus =
  (typeof SuggestionReviewStatus)[keyof typeof SuggestionReviewStatus]

export const ConfidenceBand = {
  High: 'HIGH',
  Medium: 'MEDIUM',
  Low: 'LOW',
} as const
export type ConfidenceBand = (typeof ConfidenceBand)[keyof typeof ConfidenceBand]

export const ReviewDecision = {
  Accept: 'ACCEPT',
  Reject: 'REJECT',
} as const
export type ReviewDecision = (typeof ReviewDecision)[keyof typeof ReviewDecision]

export const MappingReviewBucket = {
  Ready: 'READY',
  NeedsReview: 'NEEDS_REVIEW',
  Unmatched: 'UNMATCHED',
} as const
export type MappingReviewBucket =
  (typeof MappingReviewBucket)[keyof typeof MappingReviewBucket]

export interface MappingRun {
  id: string
  projectId: string
  relationType: MappingRelationType | string
  scope: MappingScope | string
  status: MappingRunStatus | string
  sourceCount: number | null
  /** Sources processed so far while status=RUNNING (async generate). */
  processedSourceCount?: number | null
  suggestionCount: number | null
  promptKey?: string | null
  promptVersion?: number | null
  summaryVersion?: number | null
  candidateLimit?: number | null
  modelDeploymentId?: string | null
  tokenUsageJson?: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string | null
}

export function isMappingRunTerminal(status: string | null | undefined): boolean {
  return (
    status === MappingRunStatus.Completed ||
    status === MappingRunStatus.Failed ||
    status === MappingRunStatus.Cancelled
  )
}

export function mappingRunProgressPercent(run: MappingRun | null | undefined): number {
  if (!run) return 0
  if (run.status === MappingRunStatus.Completed) return 100
  const total = run.sourceCount ?? 0
  if (total <= 0) return run.status === MappingRunStatus.Running ? 5 : 0
  const done = run.processedSourceCount ?? 0
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}

export interface MappingTokenUsage {
  inputTokens: number
  outputTokens: number
}

export function parseMappingTokenUsage(raw: string | null | undefined): MappingTokenUsage | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const input = Number(parsed.inputTokens ?? parsed.input_tokens ?? 0)
    const output = Number(parsed.outputTokens ?? parsed.output_tokens ?? 0)
    if (!Number.isFinite(input) && !Number.isFinite(output)) return null
    return {
      inputTokens: Number.isFinite(input) ? input : 0,
      outputTokens: Number.isFinite(output) ? output : 0,
    }
  } catch {
    return null
  }
}

export interface MappingSuggestion {
  id: string
  runId: string
  sourceType: string
  sourceId: string
  sourceVersion: number | null
  targetType: string | null
  targetId: string | null
  targetVersion: number | null
  relationType: MappingRelationType | string
  rank: number | null
  finalScore: number | null
  scoreMargin: number | null
  confidenceBand: ConfidenceBand | string | null
  decision: SuggestionDecision | string
  reasonCodes: string[]
  evidence: string[]
  warnings: string[]
  reviewStatus: SuggestionReviewStatus | string
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string | null
  /** Client-enriched: source/target changed since suggestion was generated */
  stale?: boolean
  /** Client-enriched: source already has a confirmed parent (single-parent relations) */
  currentTargetId?: string | null
}

/** Raw BE shape before JSON-string fields are parsed. */
export interface MappingSuggestionRaw {
  id: string
  runId: string
  sourceType: string
  sourceId: string
  sourceVersion?: number | null
  targetType?: string | null
  targetId?: string | null
  targetVersion?: number | null
  relationType: string
  rank?: number | null
  finalScore?: number | string | null
  scoreMargin?: number | string | null
  confidenceBand?: string | null
  decision: string
  reasonCodesJson?: string | null
  evidenceJson?: string | null
  warningsJson?: string | null
  reviewStatus: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt?: string | null
}

export interface MappingSuggestionPage {
  items: MappingSuggestion[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface GenerateMappingBody {
  relationType: MappingRelationType
  scope?: MappingScope
  /** Optional override. Omit / null → BE uses ACTIVE default deployment (`isDefault=true`). */
  modelDeploymentId?: string | null
}

export interface ReviewMappingBody {
  decisions: Array<{
    suggestionId: string
    decision: ReviewDecision
  }>
}

export interface ApplyMappingDraftResult {
  created: number
  skippedStale: number
  skippedConflict: number
  failed: number
}

export interface EntityLabel {
  id: string
  code: string
  name: string
  description?: string | null
  acceptanceCriteria?: string[] | null
  moduleLabel?: string | null
}

function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function mapMappingSuggestionRaw(raw: MappingSuggestionRaw): MappingSuggestion {
  return {
    id: raw.id,
    runId: raw.runId,
    sourceType: raw.sourceType,
    sourceId: raw.sourceId,
    sourceVersion: raw.sourceVersion ?? null,
    targetType: raw.targetType ?? null,
    targetId: raw.targetId ?? null,
    targetVersion: raw.targetVersion ?? null,
    relationType: raw.relationType,
    rank: raw.rank ?? null,
    finalScore: toNumber(raw.finalScore),
    scoreMargin: toNumber(raw.scoreMargin),
    confidenceBand: raw.confidenceBand ?? null,
    decision: raw.decision,
    reasonCodes: parseJsonStringArray(raw.reasonCodesJson),
    evidence: parseJsonStringArray(raw.evidenceJson),
    warnings: parseJsonStringArray(raw.warningsJson),
    reviewStatus: raw.reviewStatus,
    reviewedBy: raw.reviewedBy ?? null,
    reviewedAt: raw.reviewedAt ?? null,
    createdAt: raw.createdAt ?? null,
  }
}

export const MAPPING_RELATION_LABELS: Record<MappingRelationType, string> = {
  [MappingRelationType.RequirementToFunction]: 'Requirement ↔ Function',
  [MappingRelationType.FunctionToUseCase]: 'Function → Use Case',
  [MappingRelationType.UseCaseToTestCase]: 'Use Case → Test Case',
}

export const MAPPING_SCOPE_LABELS: Record<MappingScope, string> = {
  [MappingScope.Unmapped]: 'Unmapped',
  [MappingScope.IncompleteCoverage]: 'Incomplete coverage',
  [MappingScope.Changed]: 'Changed items',
  [MappingScope.Selected]: 'Selected',
}

/** Scopes offered in Generate UI (SELECTED needs sourceIds — not in BE generate yet). */
export const MAPPING_GENERATE_SCOPES: MappingScope[] = [
  MappingScope.Unmapped,
  MappingScope.IncompleteCoverage,
  MappingScope.Changed,
]
