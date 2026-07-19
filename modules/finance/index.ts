export {
  FinanceScenarioStatus,
  RevenueSplitMethod,
  CostAdjustmentMethod,
  CostLineStatus,
} from './domain/enums/finance.enum'
export type {
  FinanceScenarioStatus as FinanceScenarioStatusType,
  RevenueSplitMethod as RevenueSplitMethodType,
  CostAdjustmentMethod as CostAdjustmentMethodType,
  CostLineStatus as CostLineStatusType,
} from './domain/enums/finance.enum'

export type {
  FinanceScenario,
  FinanceSummary,
  PhaseFinance,
  CustomCost,
  VendorCost,
  CreateFinanceScenarioPayload,
  UpdateFinanceScenarioPayload,
  UpdatePhaseRevenuePayload,
  CreateCustomCostPayload,
  CreateVendorCostPayload,
  FinanceCompareResult,
  FinanceCompareDelta,
} from './domain/model/finance'

export {
  isFinanceDraft,
  isFinanceApproved,
  isFinanceArchived,
  canEditFinanceScenario,
  canApproveFinanceScenario,
  canArchiveFinanceScenario,
  canMarkFinanceCurrent,
  financeStatusLabel,
  financeStatusTone,
  revenueSplitLabel,
  formatPercent,
  formatHours,
  deltaDirection,
} from './domain/rules/finance.rules'

export * as financeApi from './infrastructure/api/finance.api'

export { useFinanceScenarios } from './presentation/hooks/useFinanceScenarios'
export {
  useFinanceScenarioWorkbench,
  type FinanceWorkbenchTab,
} from './presentation/hooks/useFinanceScenarioWorkbench'
export { useFinanceCompare } from './presentation/hooks/useFinanceCompare'

export { FinanceScenariosView } from './presentation/ui/FinanceScenariosView'
export { FinanceScenarioWorkbenchView } from './presentation/ui/FinanceScenarioWorkbenchView'
export { FinanceCompareView } from './presentation/ui/FinanceCompareView'
export { CreateFinanceScenarioModal } from './presentation/ui/CreateFinanceScenarioModal'
