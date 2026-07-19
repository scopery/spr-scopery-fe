import { ProfitHealthStatus } from '../enums/profitability.enum'
import type { ProfitThresholdPolicy } from '../model/profitability'

export function healthStatusLabel(status: string): string {
  switch (status) {
    case ProfitHealthStatus.Healthy:
      return 'Healthy'
    case ProfitHealthStatus.Watch:
      return 'Watch'
    case ProfitHealthStatus.AtRisk:
      return 'At risk'
    case ProfitHealthStatus.LossRisk:
      return 'Loss risk'
    default:
      return status
  }
}

export function healthStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case ProfitHealthStatus.Healthy:
      return 'success'
    case ProfitHealthStatus.Watch:
      return 'warning'
    case ProfitHealthStatus.AtRisk:
      return 'error'
    case ProfitHealthStatus.LossRisk:
      return 'error'
    default:
      return 'neutral'
  }
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

export function isThresholdOrderValid(policy: ProfitThresholdPolicy): boolean {
  return (
    policy.healthyMarginPercent >= policy.watchMarginPercent &&
    policy.watchMarginPercent >= policy.atRiskMarginPercent &&
    policy.atRiskMarginPercent >= policy.lossRiskMarginPercent
  )
}

export function rateTypeLabel(type: string): string {
  switch (type) {
    case 'ROLE_BASED':
      return 'Role-based'
    case 'INDIVIDUAL':
      return 'Individual'
    case 'FLAT':
      return 'Flat'
    default:
      return type
  }
}

export function rateCardScopeLabel(projectId: string | null): string {
  return projectId ? 'Project override' : 'Workspace'
}
