export interface EffortEstimate {
  id: string
  projectId: string
  taskId: string | null
  workspaceMemberId: string
  estimatedHours: number
  estimationMethod: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateEffortEstimatePayload {
  taskId?: string | null
  workspaceMemberId: string
  estimatedHours: number
  estimationMethod?: string | null
}

export const ActualEffortStatus = {
  Active: 'ACTIVE',
  Cancelled: 'CANCELLED',
} as const
export type ActualEffortStatus =
  (typeof ActualEffortStatus)[keyof typeof ActualEffortStatus]

export interface ActualEffortRecord {
  id: string
  projectId: string
  taskId: string | null
  workspaceMemberId: string
  effortHours: number
  effortDate: string
  status: ActualEffortStatus | string
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateActualEffortPayload {
  taskId?: string | null
  workspaceMemberId: string
  effortHours: number
  effortDate: string
}

export interface WorkloadSnapshot {
  id: string
  projectId: string
  snapshotDate: string
  totalAllocatedHours: number
  totalActualHours: number
  utilizationPercent: number
  memberBreakdown: unknown
  createdAt: string
}

export interface CreateWorkloadSnapshotPayload {
  snapshotDate?: string
}
