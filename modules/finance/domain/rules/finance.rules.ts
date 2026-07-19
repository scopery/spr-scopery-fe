import { FinanceScenarioStatus } from '../enums/finance.enum'
import type { FinanceScenario } from '../model/finance'

export function isFinanceDraft(scenario: FinanceScenario): boolean {
  return scenario.status === FinanceScenarioStatus.Draft
}

export function isFinanceApproved(scenario: FinanceScenario): boolean {
  return scenario.status === FinanceScenarioStatus.Approved
}

export function isFinanceArchived(scenario: FinanceScenario): boolean {
  return scenario.status === FinanceScenarioStatus.Archived
}

export function canEditFinanceScenario(scenario: FinanceScenario): boolean {
  return isFinanceDraft(scenario)
}

export function canApproveFinanceScenario(scenario: FinanceScenario): boolean {
  return isFinanceDraft(scenario)
}

export function canArchiveFinanceScenario(scenario: FinanceScenario): boolean {
  return !isFinanceArchived(scenario)
}

export function canMarkFinanceCurrent(scenario: FinanceScenario): boolean {
  return !isFinanceArchived(scenario)
}

export function financeStatusLabel(status: string): string {
  switch (status) {
    case FinanceScenarioStatus.Draft:
      return 'Draft'
    case FinanceScenarioStatus.Approved:
      return 'Approved'
    case FinanceScenarioStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function financeStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case FinanceScenarioStatus.Approved:
      return 'success'
    case FinanceScenarioStatus.Draft:
      return 'info'
    case FinanceScenarioStatus.Archived:
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function revenueSplitLabel(method: string): string {
  switch (method) {
    case 'EQUAL_SPLIT':
      return 'Equal split'
    case 'EFFORT_BASED':
      return 'Effort-based'
    case 'MANUAL':
      return 'Manual'
    default:
      return method
  }
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

export function formatHours(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}h`
}

export function deltaDirection(
  metric:
    | 'plannedRevenue'
    | 'budgetOfCosts'
    | 'grossMargin'
    | 'grossMarginPercent'
    | 'profitBeforeTax'
    | 'totalEstimateHours',
  delta: number
): 'better' | 'worse' | 'neutral' {
  if (delta === 0) return 'neutral'
  const higherIsBetter =
    metric === 'plannedRevenue' ||
    metric === 'grossMargin' ||
    metric === 'grossMarginPercent' ||
    metric === 'profitBeforeTax'
  if (higherIsBetter) return delta > 0 ? 'better' : 'worse'
  // costs / hours: lower often better for cost; hours delta is contextual → treat higher cost as worse
  if (metric === 'budgetOfCosts') return delta > 0 ? 'worse' : 'better'
  return 'neutral'
}
