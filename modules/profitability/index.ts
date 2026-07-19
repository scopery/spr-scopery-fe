export {
  ProfitHealthStatus,
  ProfitRateType,
  ProfitEntityStatus,
  CostSourceType,
  RevenueSourceType,
  CostForecastType,
  RevenueForecastType,
  ProfitPlanType,
  AdjustmentType,
  VarianceType,
  ProfitRiskImpactType,
} from './domain/enums/profitability.enum'

export type {
  ProfitRateCard,
  CreateProfitRateCardPayload,
  ProfitabilityProfile,
  ProfitabilitySummary,
  CostSource,
  RevenueSource,
  CostForecast,
  RevenueForecast,
  ProfitabilityPlan,
  ProfitabilityPlanVersion,
  ProfitAdjustment,
  ProfitThresholdPolicy,
  ProfitVariance,
  ProfitRiskFlag,
} from './domain/model/profitability'

export {
  healthStatusLabel,
  healthStatusTone,
  formatPercent,
  isThresholdOrderValid,
  rateTypeLabel,
  rateCardScopeLabel,
} from './domain/rules/profitability.rules'

export * as profitabilityApi from './infrastructure/api/profitability.api'

export {
  useBillingRateCards,
  type RateCardScope,
} from './presentation/hooks/useBillingRateCards'
export {
  useProfitabilityCenter,
  type ProfitabilityTab,
} from './presentation/hooks/useProfitabilityCenter'

export { ProfitabilityCenterView } from './presentation/ui/ProfitabilityCenterView'
export { BillingRateCardsView } from './presentation/ui/BillingRateCardsView'
export { CreateProfitRateCardModal } from './presentation/ui/CreateProfitRateCardModal'
