import type {
  EstimationCalculationMode,
  EstimationRunStatus,
  RateTargetDateStrategy,
  TaskEstimateStatus,
} from '../enums/estimation.enum'

export interface EstimationRunOptions {
  includeCompletedTasks?: boolean
  includeCancelledTasks?: boolean
  includeArchivedTasks?: boolean
  useBillingPreview?: boolean
  markAsCurrent?: boolean
}

export interface CreateEstimationRunPayload {
  name: string
  description?: string | null
  scheduleRunId: string
  calculationMode: EstimationCalculationMode
  rateTargetDateStrategy: RateTargetDateStrategy
  currencyPolicy: string
  options?: EstimationRunOptions
}

export interface EstimationRun {
  id: string
  projectId: string
  workspaceId: string
  scheduleRunId: string
  name: string
  description: string | null
  status: EstimationRunStatus
  calculationMode: EstimationCalculationMode | string
  rateTargetDateStrategy: RateTargetDateStrategy | string
  currencyPolicy: string
  assumptionsJson: unknown
  resultSummaryJson: unknown
  errorCode: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  actorUserId: string | null
  traceId: string | null
  createdAt: string
  updatedAt: string
  isCurrent?: boolean
}

export interface ProjectEstimateSummary {
  totalTaskCount: number
  includedTaskCount: number
  excludedTaskCount: number
  unestimatedTaskCount: number
  unresolvedRoleTaskCount: number
  unresolvedRateTaskCount: number
  totalEstimateHours: number
  totalLaborCost: number
  totalBillingPreview: number
  averageCostRate: number
  averageBillingRate: number
  currencyCode: string
  warningCount: number
}

export interface TaskEstimateSnapshot {
  id: string
  estimationRunId: string
  taskId: string
  taskCode: string
  taskTitle: string
  costRoleCode: string | null
  estimateHours: number | null
  baseCostRate: number | null
  adjustedCostRate: number | null
  estimatedLaborCost: number | null
  estimatedBillingPreview: number | null
  currencyCode: string | null
  inflationPercent: number | null
  status: TaskEstimateStatus | string
  issueCode: string | null
}

export interface WbsEstimateRollup {
  id?: string
  wbsNodeId: string
  wbsCode?: string | null
  wbsTitle?: string | null
  taskCount: number
  totalEstimateHours: number
  totalLaborCost: number
  totalBillingPreview: number
  warningCount?: number
}

export interface PhaseEstimateRollup {
  id?: string
  phaseId: string
  phaseName?: string | null
  totalEstimateHours: number
  totalLaborCost: number
  totalBillingPreview: number
  warningCount?: number
}

export interface PreviewRateImpactPayload {
  taskId: string
  workspaceId: string
  costRoleId?: string
  costRoleCode?: string
  targetDate: string
  currencyCode: string
}

export interface TaskRatePreview {
  taskId: string
  estimateHours: number
  rateSnapshot?: {
    rateCardId?: string
    rateCardVersionId?: string
    baseRate?: number
    adjustedRate?: number
    inflationPercent?: number
  }
  estimatedLaborCost?: number
  currencyCode?: string
}
