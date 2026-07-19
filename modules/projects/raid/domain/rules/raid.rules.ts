import {
  RaidDependencyType,
  RaidIssueSeverity,
  RaidItemStatus,
  RaidItemType,
  RaidRiskImpact,
  RaidRiskProbability,
  RaidRiskResponseStrategy,
  RaidValidationStatus,
} from '../enums/raid.enum'
import type { RaidItem } from '../model/raid'

export function raidTypeLabel(type: string): string {
  switch (type) {
    case RaidItemType.Risk:
      return 'Risk'
    case RaidItemType.Assumption:
      return 'Assumption'
    case RaidItemType.Issue:
      return 'Issue'
    case RaidItemType.Dependency:
      return 'Dependency'
    default:
      return type
  }
}

export function raidStatusLabel(status: string): string {
  switch (status) {
    case RaidItemStatus.Open:
      return 'Open'
    case RaidItemStatus.InProgress:
      return 'In progress'
    case RaidItemStatus.Resolved:
      return 'Resolved'
    case RaidItemStatus.Closed:
      return 'Closed'
    case RaidItemStatus.Escalated:
      return 'Escalated'
    case RaidItemStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function raidStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  switch (status) {
    case RaidItemStatus.Resolved:
    case RaidItemStatus.Closed:
      return 'success'
    case RaidItemStatus.Escalated:
      return 'error'
    case RaidItemStatus.InProgress:
      return 'warning'
    default:
      return 'neutral'
  }
}

export function canResolveRaidItem(item: { status: string }): boolean {
  return item.status === RaidItemStatus.Open || item.status === RaidItemStatus.InProgress
}

export function canCloseRaidItem(item: { status: string }): boolean {
  return item.status !== RaidItemStatus.Closed && item.status !== RaidItemStatus.Archived
}

export function canArchiveRaidItem(item: { status: string }): boolean {
  return item.status !== RaidItemStatus.Archived
}

export function canEscalateRaidItem(item: { status: string }): boolean {
  return (
    item.status === RaidItemStatus.Open ||
    item.status === RaidItemStatus.InProgress
  )
}

export function canConvertToIssue(item: { type: string; status: string }): boolean {
  return (
    item.type === RaidItemType.Risk &&
    (item.status === RaidItemStatus.Open || item.status === RaidItemStatus.InProgress)
  )
}

export function canCreateCRDraft(item: { status: string }): boolean {
  return item.status === RaidItemStatus.Open || item.status === RaidItemStatus.InProgress
}

export function raidRiskProbabilityLabel(probability: string | null): string {
  switch (probability) {
    case RaidRiskProbability.Low:
      return 'Low'
    case RaidRiskProbability.Medium:
      return 'Medium'
    case RaidRiskProbability.High:
      return 'High'
    default:
      return probability ?? '—'
  }
}

export function raidRiskImpactLabel(impact: string | null): string {
  switch (impact) {
    case RaidRiskImpact.Low:
      return 'Low'
    case RaidRiskImpact.Medium:
      return 'Medium'
    case RaidRiskImpact.High:
      return 'High'
    default:
      return impact ?? '—'
  }
}

export function raidRiskResponseStrategyLabel(strategy: string | null): string {
  switch (strategy) {
    case RaidRiskResponseStrategy.Mitigate:
      return 'Mitigate'
    case RaidRiskResponseStrategy.Avoid:
      return 'Avoid'
    case RaidRiskResponseStrategy.Transfer:
      return 'Transfer'
    case RaidRiskResponseStrategy.Accept:
      return 'Accept'
    default:
      return strategy ?? '—'
  }
}

export function raidIssueSeverityLabel(severity: string | null): string {
  switch (severity) {
    case RaidIssueSeverity.Low:
      return 'Low'
    case RaidIssueSeverity.Medium:
      return 'Medium'
    case RaidIssueSeverity.High:
      return 'High'
    case RaidIssueSeverity.Critical:
      return 'Critical'
    default:
      return severity ?? '—'
  }
}

export function raidValidationStatusLabel(status: string | null): string {
  switch (status) {
    case RaidValidationStatus.Unvalidated:
      return 'Unvalidated'
    case RaidValidationStatus.Validated:
      return 'Validated'
    case RaidValidationStatus.Invalidated:
      return 'Invalidated'
    default:
      return status ?? '—'
  }
}

export function raidDependencyTypeLabel(dependencyType: string | null): string {
  switch (dependencyType) {
    case RaidDependencyType.Internal:
      return 'Internal'
    case RaidDependencyType.External:
      return 'External'
    default:
      return dependencyType ?? '—'
  }
}

/** Rows (top→bottom) and columns (left→right) for a 3×3 probability × impact risk matrix. */
export const RISK_MATRIX_PROBABILITY_LEVELS = [
  RaidRiskProbability.High,
  RaidRiskProbability.Medium,
  RaidRiskProbability.Low,
] as const

export const RISK_MATRIX_IMPACT_LEVELS = [
  RaidRiskImpact.Low,
  RaidRiskImpact.Medium,
  RaidRiskImpact.High,
] as const

export function filterRiskItems(items: RaidItem[]): RaidItem[] {
  return items.filter((item) => item.type === RaidItemType.Risk)
}

export function getRiskMatrixCellItems(
  riskItems: RaidItem[],
  probability: string,
  impact: string
): RaidItem[] {
  return riskItems.filter((item) => item.probability === probability && item.impact === impact)
}

const RISK_LEVEL_WEIGHT: Record<string, number> = {
  [RaidRiskProbability.Low]: 0,
  [RaidRiskProbability.Medium]: 1,
  [RaidRiskProbability.High]: 2,
}

/** Simple heuristic tone for a matrix cell based on combined probability + impact weight. */
export function riskMatrixCellTone(
  probability: string,
  impact: string
): 'neutral' | 'success' | 'warning' | 'error' {
  const score = (RISK_LEVEL_WEIGHT[probability] ?? 0) + (RISK_LEVEL_WEIGHT[impact] ?? 0)
  if (score >= 3) return 'error'
  if (score >= 2) return 'warning'
  if (score >= 1) return 'neutral'
  return 'success'
}
