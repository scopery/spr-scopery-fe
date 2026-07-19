import { EstimationRunStatus } from '../enums/estimation.enum'
import type { EstimationRun } from '../model/estimation'

export function isEstimationRunning(run: EstimationRun): boolean {
  return (
    run.status === EstimationRunStatus.Pending || run.status === EstimationRunStatus.Running
  )
}

export function isEstimationCompleted(run: EstimationRun): boolean {
  return run.status === EstimationRunStatus.Completed
}

export function isEstimationFailed(run: EstimationRun): boolean {
  return run.status === EstimationRunStatus.Failed
}

export function canCancelEstimation(run: EstimationRun): boolean {
  return isEstimationRunning(run)
}

export function canMarkCurrent(run: EstimationRun): boolean {
  return isEstimationCompleted(run)
}

export function estimationStatusLabel(status: string): string {
  switch (status) {
    case EstimationRunStatus.Pending:
      return 'Pending'
    case EstimationRunStatus.Running:
      return 'Running'
    case EstimationRunStatus.Completed:
      return 'Completed'
    case EstimationRunStatus.Failed:
      return 'Failed'
    case EstimationRunStatus.Cancelled:
      return 'Cancelled'
    default:
      return status
  }
}

export function estimationStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'progress' {
  switch (status) {
    case EstimationRunStatus.Completed:
      return 'success'
    case EstimationRunStatus.Failed:
      return 'error'
    case EstimationRunStatus.Cancelled:
      return 'neutral'
    case EstimationRunStatus.Running:
    case EstimationRunStatus.Pending:
      return 'progress'
    default:
      return 'info'
  }
}

export function calculationModeLabel(mode: string): string {
  switch (mode) {
    case 'STANDARD':
      return 'Standard'
    case 'BLENDED':
      return 'Blended'
    case 'ROLE_BASED':
      return 'Role-based'
    default:
      return mode
  }
}

export function rateStrategyLabel(strategy: string): string {
  switch (strategy) {
    case 'TASK_START_DATE':
      return 'Task start'
    case 'PROJECT_START_DATE':
      return 'Project start'
    case 'RUN_DATE':
      return 'Run date'
    case 'FIXED_DATE':
      return 'Fixed date'
    default:
      return strategy
  }
}

export function taskEstimateStatusLabel(status: string): string {
  switch (status) {
    case 'RESOLVED':
      return 'Resolved'
    case 'UNRESOLVED_ROLE':
      return 'Unresolved role'
    case 'UNRESOLVED_RATE':
      return 'Unresolved rate'
    case 'EXCLUDED':
      return 'Excluded'
    default:
      return status
  }
}

export function taskEstimateStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  switch (status) {
    case 'RESOLVED':
      return 'success'
    case 'UNRESOLVED_ROLE':
    case 'UNRESOLVED_RATE':
      return 'warning'
    case 'EXCLUDED':
      return 'neutral'
    default:
      return 'info'
  }
}

export function formatHours(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}h`
}
