import type {
  CostAdjustmentMethod,
  CostLineStatus,
  FinanceScenarioStatus,
  RevenueSplitMethod,
} from '../enums/finance.enum'

export interface ContingencyInput {
  method: CostAdjustmentMethod
  percent?: number | null
  fixedAmount?: number | null
}

export interface OverheadInput {
  method: CostAdjustmentMethod
  percent?: number | null
  fixedAmount?: number | null
}

export interface CreateFinanceScenarioPayload {
  name: string
  description?: string | null
  code: string
  estimationRunId: string
  currencyCode: string
  plannedRevenue: number
  revenueSplitMethod: RevenueSplitMethod
  contingency: ContingencyInput
  overhead: OverheadInput
  targetMarginPercent?: number | null
  assumptionsJson?: unknown
  markAsCurrent?: boolean
}

export interface UpdateFinanceScenarioPayload {
  name?: string
  description?: string | null
  plannedRevenue?: number
  revenueSplitMethod?: RevenueSplitMethod
  contingency?: ContingencyInput
  overhead?: OverheadInput
  targetMarginPercent?: number | null
  assumptionsJson?: unknown
}

export interface FinanceScenario {
  id: string
  projectId: string
  workspaceId: string
  estimationRunId: string
  code: string
  name: string
  description?: string | null
  scenarioVersion: number
  status: FinanceScenarioStatus | string
  currencyCode: string
  plannedRevenue: number
  revenueSplitMethod?: RevenueSplitMethod | string
  contingencyMethod?: CostAdjustmentMethod | string
  contingencyPercent?: number | null
  contingencyFixedAmount?: number | null
  overheadMethod?: CostAdjustmentMethod | string
  overheadPercent?: number | null
  overheadFixedAmount?: number | null
  targetMarginPercent?: number | null
  assumptionsJson?: unknown
  currentFlag: boolean
  approvedAt: string | null
  formulaVersion?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface FinanceSummary {
  id: string
  financeScenarioId: string
  projectId: string
  currencyCode: string
  totalEstimateHours: number
  totalLaborCost: number
  totalCustomCost: number
  totalVendorCost: number
  totalContingency: number
  totalDirectCost: number
  totalOverhead: number
  budgetOfCosts: number
  plannedRevenue: number
  grossMargin: number
  grossMarginPercent: number
  profitBeforeTax: number
  pbtPercent: number
  averageCostRate?: number | null
  formulaVersion?: string | null
}

export interface PhaseFinance {
  id: string
  financeScenarioId: string
  projectPhaseId: string
  phaseNameSnapshot: string
  phaseOrder: number
  estimateHours: number
  laborCost: number
  customCost: number
  vendorCost: number
  contingencyAmount: number
  directCost: number
  overheadAmount: number
  budgetOfCosts: number
  plannedRevenue: number
  revenuePercent: number
  grossMargin: number
  grossMarginPercent: number
  profitBeforeTax: number
  pbtPercent: number
}

export interface UpdatePhaseRevenuePayload {
  plannedRevenue: number
  revenuePercent: number
}

export interface CustomCost {
  id: string
  financeScenarioId: string
  projectPhaseId: string
  category: string
  name: string
  description?: string | null
  amount: number
  currencyCode: string
  costDate: string | null
  status: CostLineStatus | string
}

export interface CreateCustomCostPayload {
  projectPhaseId: string
  category: string
  name: string
  description?: string | null
  amount: number
  currencyCode: string
  costDate?: string | null
}

export interface UpdateCustomCostPayload {
  projectPhaseId?: string
  category?: string
  name?: string
  description?: string | null
  amount?: number
  currencyCode?: string
  costDate?: string | null
}

export interface VendorCost {
  id: string
  financeScenarioId: string
  projectPhaseId: string
  vendorName: string
  description?: string | null
  amount: number
  currencyCode: string
  status: CostLineStatus | string
}

export interface CreateVendorCostPayload {
  projectPhaseId: string
  vendorName: string
  description?: string | null
  amount: number
  currencyCode: string
}

export interface UpdateVendorCostPayload {
  projectPhaseId?: string
  vendorName?: string
  description?: string | null
  amount?: number
  currencyCode?: string
}

export interface FinanceCompareDelta {
  plannedRevenueDelta: number
  budgetOfCostsDelta: number
  grossMarginDelta: number
  grossMarginPercentDelta: number
  profitBeforeTaxDelta: number
  totalEstimateHoursDelta: number
}

export interface FinanceCompareResult {
  projectId: string
  leftScenarioId: string
  rightScenarioId: string
  leftScenario: FinanceScenario
  rightScenario: FinanceScenario
  leftSummary: FinanceSummary
  rightSummary: FinanceSummary
  delta: FinanceCompareDelta
}
