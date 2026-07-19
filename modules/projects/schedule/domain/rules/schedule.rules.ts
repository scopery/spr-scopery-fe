import { ScheduleRunStatus } from '../enums/schedule.enum'

export function scheduleRunStatusLabel(status: string): string {
  switch (status) {
    case ScheduleRunStatus.Pending:
      return 'Pending'
    case ScheduleRunStatus.Running:
      return 'Running'
    case ScheduleRunStatus.Completed:
      return 'Completed'
    case ScheduleRunStatus.Failed:
      return 'Failed'
    case ScheduleRunStatus.Cancelled:
      return 'Cancelled'
    default:
      return status
  }
}

export function scheduleRunStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  switch (status) {
    case ScheduleRunStatus.Completed:
      return 'success'
    case ScheduleRunStatus.Failed:
      return 'error'
    case ScheduleRunStatus.Running:
    case ScheduleRunStatus.Pending:
      return 'warning'
    default:
      return 'neutral'
  }
}

export function canCancelScheduleRun(run: { status: string }): boolean {
  return run.status === ScheduleRunStatus.Pending || run.status === ScheduleRunStatus.Running
}

export function taskScheduleRiskTone(riskStatus: string): 'neutral' | 'success' | 'warning' | 'error' {
  switch (riskStatus) {
    case 'ON_TRACK':
      return 'success'
    case 'AT_RISK':
      return 'warning'
    case 'LATE':
    case 'OVER_CAPACITY':
      return 'error'
    default:
      return 'neutral'
  }
}
