export interface TaskRoleContribution {
  id: string
  projectId: string
  taskId: string
  userId: string | null
  costRoleCode: string | null
  costRoleName: string | null
  plannedHours: number
  actualHours: number | null
  rateSnapshotPerHour: number | null
  currencyCode: string | null
  estimatedCost: number | null
  periodStart: string | null
  periodEnd: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRoleContributionPayload {
  userId?: string | null
  costRoleCode?: string | null
  costRoleName?: string | null
  plannedHours: number
  rateSnapshotPerHour?: number | null
  currencyCode?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  notes?: string | null
}
