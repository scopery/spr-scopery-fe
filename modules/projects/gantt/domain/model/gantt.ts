/**
 * Gantt domain model — matches BE `GanttViewResponse`
 * (`GET /api/projects/{projectId}/gantt`).
 */
export interface GanttItem {
  id: string
  itemType: string
  sourceEntityType: string
  sourceEntityId: string
  parentItemId: string | null
  title: string
  startDate: string | null
  endDate: string | null
  scheduleStatus: string
  assigneeUserId: string | null
  phaseId: string | null
  wbsNodeId: string | null
  sortOrder: number
  zeroDuration: boolean
  metadata: Record<string, unknown>
  /** Resolved client-side by `buildGanttTree`. */
  children?: GanttItem[]
}

export interface GanttTreeItem extends GanttItem {
  children: GanttTreeItem[]
}

export interface GanttSummary {
  itemCount: number
  taskCount: number
  scheduledTaskCount: number
  unscheduledTaskCount: number
  milestoneCount: number
  dependencyCount: number
  issueCount: number
}

export interface GanttView {
  project: Record<string, unknown> | null
  scheduleRun: Record<string, unknown> | null
  items: GanttItem[]
  dependencies: unknown[]
  issues: unknown[]
  summary: GanttSummary
}

export interface GanttViewParams {
  scheduleRunId?: string
  dateFrom?: string
  dateTo?: string
  includeUnscheduled?: boolean
  includeArchived?: boolean
  groupBy?: string
}

export interface RecalculateGanttPayload {
  planningStartDate?: string | null
  planningEndDate?: string | null
  includeCompletedTasks?: boolean
  markAsCurrent?: boolean
}

export interface GanttDependency {
  id: string
  projectId: string
  predecessorTaskId: string
  successorTaskId: string
  dependencyType: string
  lagDays: number | null
}

export interface GanttIssue {
  id: string
  projectId: string
  issueType: string
  severity: string
  description: string
  affectedEntityId: string | null
}

export interface CriticalPathItem {
  taskId: string
  taskTitle: string
  startDate: string | null
  endDate: string | null
  slack: number
}

export interface MoveGanttTaskPayload {
  manualStartDate: string
  manualFinishDate: string
  reason: string
  recalculate?: boolean
}

export interface ResizeGanttTaskPayload {
  manualFinishDate: string
  reason: string
  recalculate?: boolean
}

export interface CreateGanttDependencyPayload {
  predecessorTaskId: string
  successorTaskId: string
  dependencyType: string
  lagDays?: number | null
}

export interface GanttExportParams {
  format?: 'pdf' | 'xlsx' | 'png'
  scheduleRunId?: string
}
