import type { MyWorkWindow } from '../enums/my-work.enum'

export interface MyWorkSummary {
  total: number
  overdue: number
  dueThisWindow: number
  inProgress: number
  todo: number
  blocked: number
  undated: number
}

export interface MyWorkTaskItem {
  taskId: string
  projectId: string
  projectCode: string
  projectName: string
  code: string
  title: string
  status: string
  priority: string
  inChargeUserId: string
  plannedStartDate: string | null
  dueDate: string | null
  estimateHours: number | null
  projectPhaseId: string | null
  projectPhaseName: string | null
  wbsNodeId: string | null
  isOverdue: boolean
  updatedAt: string
  /** Instant when task was marked DONE; null if still open. */
  completedAt?: string | null
  completedBy?: string | null
}

export interface MyWorkPageInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface MyWorkResponse {
  workspaceId: string
  userId: string
  window: MyWorkWindow | string
  dateFrom: string
  dateTo: string
  summary: MyWorkSummary
  items: MyWorkTaskItem[]
  page: MyWorkPageInfo
}

export interface MyWorkParams {
  window?: MyWorkWindow | string
  dateFrom?: string
  dateTo?: string
  status?: string | string[]
  projectId?: string
  includeCompleted?: boolean
  page?: number
  size?: number
}
