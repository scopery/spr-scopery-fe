import { DecisionStatus } from '../enums/decision.enum'

export function decisionStatusLabel(status: string): string {
  switch (status) {
    case DecisionStatus.Pending:
      return 'Pending'
    case DecisionStatus.Decided:
      return 'Decided'
    case DecisionStatus.Rejected:
      return 'Rejected'
    case DecisionStatus.Superseded:
      return 'Superseded'
    case DecisionStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function decisionStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  switch (status) {
    case DecisionStatus.Decided:
      return 'success'
    case DecisionStatus.Rejected:
      return 'error'
    case DecisionStatus.Superseded:
      return 'warning'
    default:
      return 'neutral'
  }
}

export function canDecideDecision(decision: { status: string }): boolean {
  return decision.status === DecisionStatus.Pending
}

export function canRejectDecision(decision: { status: string }): boolean {
  return decision.status === DecisionStatus.Pending
}

export function canSupersedeDecision(decision: { status: string }): boolean {
  return decision.status === DecisionStatus.Decided
}

export function canArchiveDecision(decision: { status: string }): boolean {
  return decision.status !== DecisionStatus.Archived
}
