import type {
  AdjustmentType,
  CostForecastType,
  CostSourceType,
  ProfitEntityStatus,
  ProfitHealthStatus,
  ProfitPlanType,
  ProfitRateType,
  ProfitRiskImpactType,
  RevenueForecastType,
  RevenueSourceType,
  VarianceType,
} from '../enums/profitability.enum'

export interface ProfitRateCard {
  id: string
  workspaceId: string
  projectId: string | null
  rateCode: string
  name: string
  rateType: ProfitRateType | string
  roleName: string | null
  teamId: string | null
  currency: string
  amountPerHour: number
  amountPerDay: number
  status: ProfitEntityStatus | string
}

export interface CreateProfitRateCardPayload {
  rateCode: string
  name: string
  rateType: ProfitRateType
  roleName?: string | null
  teamId?: string | null
  currency: string
  amountPerHour: number
  amountPerDay: number
}

export interface UpdateProfitRateCardPayload {
  name?: string
  rateType?: ProfitRateType
  roleName?: string | null
  teamId?: string | null
  currency?: string
  amountPerHour?: number
  amountPerDay?: number
}

export interface ProfitabilityProfile {
  id: string
  projectId: string
  workspaceId: string
  currency: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ProfitabilitySummary {
  projectId: string
  currency: string
  totalRevenue: number
  totalCost: number
  grossMargin: number
  grossMarginPercent: number
  profitBeforeTax: number
  pbtPercent: number
  healthStatus: ProfitHealthStatus | string
  updatedAt: string
}

export interface CostSource {
  id: string
  sourceType: CostSourceType | string
  sourceId: string | null
  effortHours: number | null
  rateAmount: number | null
  amount: number
  currency: string
  includedInForecast: boolean
  status: ProfitEntityStatus | string
}

export interface CreateCostSourcePayload {
  sourceType: CostSourceType
  sourceId?: string | null
  effortHours?: number | null
  rateAmount?: number | null
  amount: number
  currency: string
  includedInForecast?: boolean
}

export interface RevenueSource {
  id: string
  sourceType: RevenueSourceType | string
  sourceId: string | null
  amount: number
  currency: string
  includedInForecast: boolean
  confidence: number | null
  status: ProfitEntityStatus | string
}

export interface CreateRevenueSourcePayload {
  sourceType: RevenueSourceType
  sourceId?: string | null
  amount: number
  currency: string
  includedInForecast?: boolean
  confidence?: number | null
}

export interface CostForecast {
  id: string
  forecastType: CostForecastType | string
  currency: string
  forecastAmount: number
  confidencePercent: number | null
  forecastDate: string | null
  assumptionNotes: string | null
  status?: ProfitEntityStatus | string
}

export interface CreateCostForecastPayload {
  forecastType: CostForecastType | string
  currency: string
  forecastAmount: number
  confidencePercent?: number | null
  forecastDate?: string | null
  assumptionNotes?: string | null
}

export interface RevenueForecast {
  id: string
  forecastType: RevenueForecastType | string
  currency: string
  forecastAmount: number
  confidencePercent: number | null
  forecastDate: string | null
  assumptionNotes: string | null
  status?: ProfitEntityStatus | string
}

export interface CreateRevenueForecastPayload {
  forecastType: RevenueForecastType | string
  currency: string
  forecastAmount: number
  confidencePercent?: number | null
  forecastDate?: string | null
  assumptionNotes?: string | null
}

export interface ProfitabilityPlan {
  id: string
  projectId: string
  planCode: string
  name: string
  planType: ProfitPlanType | string
  status: string
  currentVersionId: string | null
  currency?: string
  plannedRevenue?: number | null
  plannedCost?: number | null
  plannedProfit?: number | null
  plannedMarginPercent?: number | null
}

export interface CreateProfitabilityPlanPayload {
  planCode: string
  name: string
  planType: ProfitPlanType
  versionLabel?: string
  currency: string
  plannedRevenue: number
  plannedCost: number
  plannedProfit: number
  plannedMarginPercent: number
  baselineRevenue?: number | null
  baselineCost?: number | null
  baselineProfit?: number | null
  baselineMarginPercent?: number | null
  assumptionNotes?: string | null
}

export interface ProfitabilityPlanVersion {
  id: string
  planId: string
  versionLabel: string
  status: string
  createdAt?: string
  finalizedAt?: string | null
  plannedRevenue?: number | null
  plannedCost?: number | null
  plannedProfit?: number | null
  plannedMarginPercent?: number | null
}

export interface ProfitAdjustment {
  id: string
  adjustmentType: AdjustmentType | string
  amount: number
  reason: string
  applied?: boolean
  appliedAt?: string | null
  status?: string
}

export interface CreateProfitAdjustmentPayload {
  adjustmentType: AdjustmentType
  amount: number
  reason: string
}

export interface ProfitThresholdPolicy {
  projectId?: string
  healthyMarginPercent: number
  watchMarginPercent: number
  atRiskMarginPercent: number
  lossRiskMarginPercent: number
}

export interface ProfitVariance {
  id: string
  varianceType: VarianceType | string
  fromAmount: number
  toAmount: number
  varianceAmount: number
  variancePercent: number
  currency: string
  explanation: string | null
  sourceSnapshotId: string | null
  createdAt?: string
}

export interface CreateProfitVariancePayload {
  varianceType: VarianceType
  fromAmount: number
  toAmount: number
  varianceAmount: number
  variancePercent: number
  currency: string
  explanation?: string | null
  sourceSnapshotId?: string | null
}

export interface ProfitRiskFlag {
  id: string
  reason: string
  impactType: ProfitRiskImpactType | string
  amountAtRisk: number
  status: string
  createdAt?: string
}

export interface CreateProfitRiskFlagPayload {
  reason: string
  impactType: ProfitRiskImpactType
  amountAtRisk: number
}
