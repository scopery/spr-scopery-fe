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
    case 'TASK_ESTIMATE_ONLY':
      return 'Estimate only'
    case 'TASK_ESTIMATE_WITH_RATE':
      return 'Estimate + rate'
    case 'SCHEDULED_WORK_WITH_RATE':
      return 'Scheduled work + rate'
    default:
      return mode
  }
}

export function rateStrategyLabel(strategy: string): string {
  switch (strategy) {
    case 'PROJECT_PLANNED_START':
      return 'Project start date'
    case 'TASK_DUE_DATE':
      return 'Task due date'
    case 'TASK_SCHEDULED_START':
      return 'Task scheduled start'
    case 'TASK_SCHEDULED_FINISH':
      return 'Task scheduled finish'
    case 'RUN_DATE':
      return 'Run date'
    case 'CUSTOM_DATE':
      return 'Custom date'
    case 'TASK_DUE_DATE_OR_PROJECT_START':
      return 'Due date or project start'
    default:
      return strategy
  }
}

export function taskEstimateStatusLabel(status: string): string {
  switch (status) {
    case 'CALCULATED':
      return 'Calculated'
    case 'ROLE_UNRESOLVED':
      return 'Unresolved role'
    case 'RATE_UNRESOLVED':
      return 'Unresolved rate'
    case 'TASK_UNESTIMATED':
      return 'Not estimated'
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
    case 'CALCULATED':
      return 'success'
    case 'ROLE_UNRESOLVED':
    case 'RATE_UNRESOLVED':
    case 'TASK_UNESTIMATED':
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
