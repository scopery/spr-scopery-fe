/**
 * Schedule Run domain model — matches BE `ScheduleRunResponse`
 * (`/api/projects/{projectId}/schedule-runs`).
 */
export interface ScheduleRun {
  id: string
  projectId: string
  status: string
  algorithmVersion: string
  planningStartDate: string | null
  planningEndDate: string | null
  resultSummaryJson: Record<string, unknown> | null
  errorCode: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface CreateScheduleRunOptions {
  includeCompletedTasks?: boolean
  useProjectAllocationsOnly?: boolean
  markAsCurrent?: boolean
}

export interface CreateScheduleRunPayload {
  planningStartDate?: string | null
  planningEndDate?: string | null
  options?: CreateScheduleRunOptions
}

/** Matches BE `TaskScheduleResponse` (`/api/projects/{projectId}/schedule/current/tasks`). */
export interface TaskSchedule {
  id: string
  scheduleRunId: string
  taskId: string
  assigneeUserId: string | null
  estimatedStartDate: string | null
  estimatedFinishDate: string | null
  scheduledHours: number
  unscheduledHours: number
  dueDate: string | null
  dueDateCapacityGapHours: number
  riskStatus: string
  scheduleStatus: string
}

export interface TaskScheduleParams {
  taskId?: string
  assigneeUserId?: string
  riskStatus?: string
  scheduleStatus?: string
}

export interface DailyWorkEntry {
  date: string
  taskId: string
  taskTitle: string
  assigneeUserId: string | null
  estimatedHours: number
  scheduledHours: number
}

export interface ScheduleIssue {
  id: string
  issueType: string
  severity: string
  description: string
  affectedTaskId: string | null
}

export interface TaskScheduleDetail {
  taskId: string
  scheduleRunId: string
  estimatedStartDate: string | null
  estimatedFinishDate: string | null
  scheduledHours: number
  riskStatus: string
}

export interface DailyWorkParams {
  dateFrom?: string
  dateTo?: string
  assigneeUserId?: string
}
