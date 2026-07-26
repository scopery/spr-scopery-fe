import type {
  BaselineStatus,
  ChangeItemOperation,
  ChangeOrderStatus,
  ChangePriority,
  ChangeRequestStatus,
  ChangeType,
  RiskImpact,
  ScopeImpact,
} from '../enums/project-control.enum'

export interface CreateBaselinePayload {
  name: string
  description?: string | null
  sourceScheduleRunId?: string | null
  sourceEstimationRunId?: string | null
  sourceFinanceScenarioId?: string | null
  sourceQuoteVersionId?: string | null
}

export interface UpdateBaselinePayload {
  name?: string
  description?: string | null
}

/** Matches BE BaselineSummaryDto */
export interface BaselineSummary {
  phaseCount: number
  wbsCount: number
  taskCount: number
  dependencyCount: number
  milestoneCount: number
  plannedStartDate: string | null
  plannedEndDate: string | null
  estimateHours: number | null
  revenue: number | null
  directCost: number | null
  overhead: number | null
  grossMargin: number | null
  pbt: number | null
  currencyCode: string | null
  totalQuotedAmount: number | null
  targetMarginPercent: number | null
}

/** Matches BE BaselineTreeNodeDto — Phase → WBS → Task */
export interface BaselineTreeNode {
  id: string
  type: string
  code: string | null
  name: string
  meta: Record<string, unknown> | null
  children: BaselineTreeNode[]
}

/** Matches BE BaselineHealthDto */
export interface BaselineHealth {
  snapshotStatus: string | null
  sources: Array<{ source: string; status: string | null }>
  approval: {
    status: string | null
    approvedAt: string | null
    approvedBy: string | null
  } | null
  issues: Array<{
    code: string | null
    message: string | null
    severity: string | null
  }>
}

/** Matches BE BaselineProvenanceDto */
export interface BaselineProvenance {
  sources: Array<{
    source: string
    id: string | null
    label: string | null
    status: string | null
    capturedAt: string | null
  }>
}

export interface ProjectBaseline {
  id: string
  projectId: string
  workspaceId: string
  baselineNumber: number
  name: string
  description: string | null
  status: BaselineStatus | string
  currentFlag: boolean
  sourceScheduleRunId: string | null
  sourceEstimationRunId: string | null
  sourceFinanceScenarioId: string | null
  sourceQuoteVersionId: string | null
  summary: BaselineSummary | null
  projectTree: BaselineTreeNode[] | null
  health: BaselineHealth | null
  provenance: BaselineProvenance | null
  formulaVersion: string | null
  approvedAt: string | null
  approvedBy: string | null
  archivedAt: string | null
  archivedBy: string | null
  createdAt: string
  updatedAt: string
}

/** Matches BE BaselineCompareResponse */
export interface BaselineCompareResponse {
  left: { label: string; summary: BaselineSummary | null }
  right: { label: string; summary: BaselineSummary | null }
  deltas: Array<{
    field: string
    label: string
    baseline: unknown
    current: unknown
    direction: string | null
  }>
  changeCounts: {
    phasesAdded: number
    phasesRemoved: number
    wbsAdded: number
    wbsRemoved: number
    tasksAdded: number
    tasksRemoved: number
    milestonesAdded: number
    milestonesRemoved: number
  }
  highlights: string[]
}

export interface CreateChangeRequestPayload {
  code: string
  title: string
  description?: string | null
  changeType: ChangeType
  priority: ChangePriority
  baselineId: string
  reason: string
}

export interface UpdateChangeRequestPayload {
  title?: string
  description?: string | null
  changeType?: ChangeType
  priority?: ChangePriority
  reason?: string
}

export interface ChangeRequest {
  id: string
  projectId: string
  workspaceId: string
  baselineId: string
  code: string
  title: string
  description: string | null
  changeType: ChangeType | string
  priority: ChangePriority | string
  status: ChangeRequestStatus | string
  reason: string
  submittedAt: string | null
  submittedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  rejectionReason: string | null
  appliedAt: string | null
  appliedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateChangeRequestItemPayload {
  targetType: string
  targetId?: string | null
  operation: ChangeItemOperation
  summary: string
  affectedAreas?: string[] | null
  beforeSnapshotJson?: unknown
  afterSnapshotJson?: unknown
  applyPayloadJson?: unknown
}

export interface ChangeRequestItem {
  id: string
  changeRequestId: string
  targetType: string
  targetId: string | null
  operation: ChangeItemOperation | string
  summary: string
  affectedAreas?: string[] | null
  beforeSnapshotJson: unknown
  afterSnapshotJson: unknown
  applyPayloadJson: unknown
  status: string
  createdAt: string
}

export interface ChangeImpact {
  id: string
  changeRequestId: string
  currencyCode: string
  scopeImpact: ScopeImpact | string
  scheduleImpactDays: number | null
  estimateHoursImpact: number | null
  laborCostImpact: number | null
  directCostImpact?: number | null
  overheadImpact?: number | null
  revenueImpact: number | null
  grossMarginImpact: number | null
  pbtImpact?: number | null
  quoteAmountImpact?: number | null
  riskImpact: RiskImpact | string
  impactSummaryJson?: unknown
}

export interface UpdateChangeImpactPayload {
  currencyCode: string
  scopeImpact: ScopeImpact
  scheduleImpactDays?: number | null
  estimateHoursImpact?: number | null
  laborCostImpact?: number | null
  directCostImpact?: number | null
  overheadImpact?: number | null
  revenueImpact?: number | null
  grossMarginImpact?: number | null
  pbtImpact?: number | null
  quoteAmountImpact?: number | null
  riskImpact: RiskImpact
  impactSummaryJson?: unknown
}

export interface CreateChangeOrderPayload {
  code: string
  title: string
  description?: string | null
  commercialImpactJson?: unknown
  sourceQuoteVersionId?: string | null
}

export interface ChangeOrder {
  id: string
  changeRequestId: string
  projectId: string
  workspaceId: string
  code: string
  title: string
  description: string | null
  status: ChangeOrderStatus | string
  commercialImpactJson: unknown
  sourceQuoteVersionId: string | null
  futureContractId: string | null
  approvedAt: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}
