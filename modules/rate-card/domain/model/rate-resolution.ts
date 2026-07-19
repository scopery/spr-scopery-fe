export interface ResolveRatePayload {
  workspaceId?: string
  organizationId?: string
  projectId?: string
  costRoleId?: string
  costRoleCode?: string
  targetDate: string
  currencyCode?: string
  rateType?: string
}

export interface RateSnapshot {
  rateCardId: string
  rateCardVersionId: string
  rateCardLineId: string
  costRoleId: string
  costRoleCode: string
  baseCostRate: number
  adjustedCostRate: number
  baseBillingRate: number | null
  adjustedBillingRate: number | null
  currencyCode: string
  inflationPolicyId: string | null
  inflationPercent: number | null
  yearsForward: number
  resolvedForDate: string
  resolvedAt: string
}

export interface PreviewTaskRatePayload {
  taskId: string
  workspaceId?: string
  costRoleId?: string
  costRoleCode?: string
  targetDate?: string
  currencyCode?: string
}

export interface TaskRatePreview {
  taskId: string
  estimateHours: number
  rateSnapshot: RateSnapshot
  estimatedLaborCostPreview: number
  label: string
}
